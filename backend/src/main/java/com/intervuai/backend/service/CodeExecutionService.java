package com.intervuai.backend.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.intervuai.backend.model.QuestionBank;
import com.intervuai.backend.repository.QuestionBankRepository;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

/** Sends untrusted submissions to an isolated Judge0 service. The application server never runs submitted code. */
@Service
public class CodeExecutionService {
    private static final Logger log = LoggerFactory.getLogger(CodeExecutionService.class);
    private static final Pattern TWO_INTS = Pattern.compile("\\[\\s*(-?\\d+)\\s*,\\s*(-?\\d+)\\s*]");
    private static final List<TestCase> TWO_SUM_CASES = List.of(
            new TestCase(new int[] { 2, 7, 11, 15 }, 9, new int[] { 0, 1 }, null, false),
            new TestCase(new int[] { 3, 2, 4 }, 6, new int[] { 1, 2 }, null, true),
            new TestCase(new int[] { 3, 3 }, 6, new int[] { 0, 1 }, null, true),
            new TestCase(new int[] { -1, -2, -3, -4, -5 }, -8, new int[] { 2, 4 }, null, true));
    private static final List<TestCase> STOCK_CASES = List.of(
            new TestCase(new int[] { 7, 1, 5, 3, 6, 4 }, 0, null, 5, false),
            new TestCase(new int[] { 7, 6, 4, 3, 1 }, 0, null, 0, true),
            new TestCase(new int[] { 2, 4, 1 }, 0, null, 2, true),
            new TestCase(new int[] { 3, 3, 5, 0, 0, 3, 1, 4 }, 0, null, 4, true));

    private final QuestionBankRepository questionBankRepository;
    private final String runnerUrl;
    private final String authToken;
    private final String authUser;
    private final RestClient restClient;

    public CodeExecutionService(
            QuestionBankRepository questionBankRepository,
            @Value("${app.code-runner.url:}") String runnerUrl,
            @Value("${app.code-runner.auth-token:}") String authToken,
            @Value("${app.code-runner.auth-user:}") String authUser) {
        this.questionBankRepository = questionBankRepository;
        this.runnerUrl = runnerUrl == null ? "" : runnerUrl.trim().replaceAll("/+$", "");
        this.authToken = authToken == null ? "" : authToken;
        this.authUser = authUser == null ? "" : authUser;
        var requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(3));
        requestFactory.setReadTimeout(Duration.ofSeconds(20));
        this.restClient = RestClient.builder()
                .baseUrl(this.runnerUrl.isBlank() ? "http://127.0.0.1" : this.runnerUrl)
                .requestFactory(requestFactory)
                .build();
    }

    public CodeRunResult run(Long questionId, String language, String code) {
        if (runnerUrl.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "The secure code runner is not configured. Set CODE_RUNNER_URL to your private Judge0 service.");
        }
        QuestionBank question = questionBankRepository.findById(questionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found."));
        if (!"DSA".equalsIgnoreCase(question.getInterviewType())) {
            throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED,
                    "Secure test execution is not configured for this challenge yet.");
        }
        boolean twoSum = "Two Sum".equalsIgnoreCase(question.getTitle());
        boolean stock = "Best Time to Buy and Sell Stock".equalsIgnoreCase(question.getTitle());
        if (!twoSum && !stock) {
            throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED,
                    "Secure test execution is not configured for this challenge yet.");
        }
        if (code == null || code.isBlank() || code.length() > 12000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a solution under 12,000 characters.");
        }

        String normalizedLanguage = language == null ? "" : language.trim();
        int languageId = switch (normalizedLanguage) {
            case "Java" -> 62;
            case "Python" -> 71;
            case "JavaScript" -> 63;
            case "C++" -> 54;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a supported programming language.");
        };
        String marker = "__INTERVU_RESULT_" + UUID.randomUUID().toString().replace("-", "") + "__";
        String source = twoSum ? buildHarness(normalizedLanguage, code, marker)
                : buildStockHarness(normalizedLanguage, code, marker);
        try {
            Judge0Response execution = restClient.post()
                    .uri("/submissions?base64_encoded=false&wait=true&fields=stdout,stderr,compile_output,status,time,memory,message")
                    .contentType(MediaType.APPLICATION_JSON)
                    .headers(this::addRunnerAuth)
                    .body(new Judge0Request(languageId, source))
                    .retrieve()
                    .body(Judge0Response.class);
            if (execution == null || execution.status() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "The code runner returned an incomplete result.");
            }
            return toPublicResult(execution, marker, twoSum ? TWO_SUM_CASES : STOCK_CASES);
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (RestClientException exception) {
            log.warn("Secure code runner request failed: {}", exception.getClass().getSimpleName());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "The secure code runner could not be reached. Check its private service URL and try again.");
        }
    }

    private void addRunnerAuth(HttpHeaders headers) {
        if (!authToken.isBlank()) headers.set("X-Auth-Token", authToken);
        if (!authUser.isBlank()) headers.set("X-Auth-User", authUser);
    }

    private CodeRunResult toPublicResult(Judge0Response execution, String marker, List<TestCase> cases) {
        int statusId = execution.status().id();
        if (statusId != 3) {
            String status = switch (statusId) {
                case 1, 2 -> "PROCESSING";
                case 5 -> "TIME_LIMIT_EXCEEDED";
                case 6 -> "COMPILATION_ERROR";
                case 7, 8, 9, 10, 11, 12, 13, 14 -> "RUNTIME_ERROR";
                default -> "RUNNER_ERROR";
            };
            String details = switch (statusId) {
                case 5 -> "Execution exceeded the time limit. Check for an inefficient loop or recursion."
                        .concat(execution.time() == null ? "" : " Measured CPU time: " + execution.time() + "s.");
                case 6 -> "Compilation failed. Check the Solution.solve method signature and fix syntax errors.";
                case 7 -> "Your solution stopped with a runtime error. Check array bounds, null values, and return values.";
                case 1, 2 -> "The runner did not return a final result. Enable synchronous wait results on Judge0 and retry.";
                default -> "The isolated runner could not complete this submission. Try again shortly.";
            };
            return new CodeRunResult(status, false, List.of(), 0, hiddenCaseCount(cases), safeDetails(details), execution.time(), execution.memory());
        }

        List<VisibleCaseResult> visible = new ArrayList<>();
        int hiddenPassed = 0;
        for (int index = 0; index < cases.size(); index++) {
            TestCase test = cases.get(index);
            String actual = extractTaggedOutput(execution.stdout(), marker, index);
            if (actual == null) actual = "No output";
            boolean passed = test.expectedPair() != null ? matchesPair(actual, test.expectedPair())
                    : actual.equals(Integer.toString(test.expectedScalar()));
            if (test.hidden()) hiddenPassed += passed ? 1 : 0;
            else visible.add(new VisibleCaseResult(index + 1, passed,
                    test.expectedPair() != null ? Arrays.toString(test.expectedPair()) : Integer.toString(test.expectedScalar()), safeDetails(actual)));
        }
        boolean passed = visible.stream().allMatch(VisibleCaseResult::passed)
                && hiddenPassed == hiddenCaseCount(cases)
                && java.util.stream.IntStream.range(0, cases.size()).allMatch(index -> extractTaggedOutput(execution.stdout(), marker, index) != null);
        return new CodeRunResult(passed ? "ACCEPTED" : "WRONG_ANSWER", passed, visible, hiddenPassed,
                hiddenCaseCount(cases), passed ? "All visible and hidden tests passed." : "One or more tests failed. Hidden test inputs and expected outputs are kept private.",
                execution.time(), execution.memory());
    }

    private int hiddenCaseCount(List<TestCase> cases) {
        return (int) cases.stream().filter(TestCase::hidden).count();
    }

    private String extractTaggedOutput(String stdout, String marker, int index) {
        if (stdout == null) return null;
        String prefix = marker + index + ":";
        return stdout.lines().map(String::trim).filter(line -> line.startsWith(prefix))
                .map(line -> line.substring(prefix.length()).trim()).findFirst().orElse(null);
    }

    private boolean matchesPair(String actual, int[] expected) {
        Matcher matcher = TWO_INTS.matcher(actual);
        if (!matcher.matches()) return false;
        int first = Integer.parseInt(matcher.group(1));
        int second = Integer.parseInt(matcher.group(2));
        return (first == expected[0] && second == expected[1])
                || (first == expected[1] && second == expected[0]);
    }

    private String safeDetails(String details) {
        if (details == null || details.isBlank()) return "";
        String clean = details.replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", "").trim();
        return clean.length() > 1600 ? clean.substring(0, 1600) + "…" : clean;
    }

    private String buildHarness(String language, String code, String marker) {
        String cases = "{ {2,7,11,15}, {3,2,4}, {3,3}, {-1,-2,-3,-4,-5} }";
        String targets = "{ 9, 6, 6, -8 }";
        return switch (language) {
            case "Java" -> "import java.util.*;\n" + code + "\nclass Main { public static void main(String[] args) {\n"
                    + "int[][] nums = new int[][] " + cases + "; int[] targets = new int[] " + targets + ";\n"
                    + "for (int i=0; i<nums.length; i++) { int[] answer = new Solution().solve(nums[i], targets[i]); System.out.println(\"" + marker + "\" + i + \":\" + Arrays.toString(answer)); }\n} }";
            case "Python" -> code + "\nimport json as _intervu_json\n"
                    + "_intervu_cases = [([2,7,11,15],9),([3,2,4],6),([3,3],6),([-1,-2,-3,-4,-5],-8)]\n"
                    + "_intervu_solution = Solution()\nfor _i, (_nums, _target) in enumerate(_intervu_cases):\n"
                    + "    print(\"" + marker + "\" + str(_i) + \":\" + _intervu_json.dumps(_intervu_solution.solve(_nums, _target), separators=(',', ':')))\n";
            case "JavaScript" -> code + "\nconst _intervuCases = [[[2,7,11,15],9],[[3,2,4],6],[[3,3],6],[[-1,-2,-3,-4,-5],-8]];\n"
                    + "const _intervuSolution = new Solution();\nfor (let _i=0; _i<_intervuCases.length; _i++) { const [_nums, _target]=_intervuCases[_i]; console.log(\"" + marker + "\" + _i + \":\" + JSON.stringify(_intervuSolution.solve(_nums, _target))); }\n";
            case "C++" -> "#include <bits/stdc++.h>\nusing namespace std;\n" + code + "\nint main() {\n"
                    + "vector<vector<int>> nums={{2,7,11,15},{3,2,4},{3,3},{-1,-2,-3,-4,-5}}; vector<int> targets={9,6,6,-8}; Solution solution;\n"
                    + "for (int i=0;i<(int)nums.size();i++) { auto answer=solution.solve(nums[i],targets[i]); cout << \"" + marker + "\" << i << ':' << '['; for (int j=0;j<(int)answer.size();j++) { if(j) cout << ','; cout << answer[j]; } cout << \"]\\n\"; }\nreturn 0;\n}\n";
            default -> throw new IllegalArgumentException("Unsupported language.");
        };
    }

    private String buildStockHarness(String language, String code, String marker) {
        return switch (language) {
            case "Java" -> "import java.util.*;\n" + code + "\nclass Main { public static void main(String[] args) { int[][] prices={{7,1,5,3,6,4},{7,6,4,3,1},{2,4,1},{3,3,5,0,0,3,1,4}}; Solution solution=new Solution(); for(int i=0;i<prices.length;i++) System.out.println(\"" + marker + "\"+i+\":\"+solution.maxProfit(prices[i])); } }";
            case "Python" -> code + "\n_prices=[[7,1,5,3,6,4],[7,6,4,3,1],[2,4,1],[3,3,5,0,0,3,1,4]]\n_solution=Solution()\nfor _i,_p in enumerate(_prices): print(\"" + marker + "\"+str(_i)+\":\"+str(_solution.maxProfit(_p)))\n";
            case "JavaScript" -> code + "\nconst _prices=[[7,1,5,3,6,4],[7,6,4,3,1],[2,4,1],[3,3,5,0,0,3,1,4]]; const _solution=new Solution(); for(let i=0;i<_prices.length;i++) console.log(\"" + marker + "\"+i+\":\"+_solution.maxProfit(_prices[i]));\n";
            case "C++" -> "#include <bits/stdc++.h>\nusing namespace std;\n" + code + "\nint main(){ vector<vector<int>> prices={{7,1,5,3,6,4},{7,6,4,3,1},{2,4,1},{3,3,5,0,0,3,1,4}}; Solution solution; for(int i=0;i<(int)prices.size();i++) cout << \"" + marker + "\" << i << ':' << solution.maxProfit(prices[i]) << '\\n'; }\n";
            default -> throw new IllegalArgumentException("Unsupported language.");
        };
    }

    private record TestCase(int[] nums, int target, int[] expectedPair, Integer expectedScalar, boolean hidden) { }
    private record Judge0Request(
            @JsonProperty("language_id") int languageId,
            @JsonProperty("source_code") String sourceCode,
            @JsonProperty("cpu_time_limit") double cpuTimeLimit,
            @JsonProperty("cpu_extra_time") double cpuExtraTime,
            @JsonProperty("wall_time_limit") double wallTimeLimit,
            @JsonProperty("memory_limit") int memoryLimit,
            @JsonProperty("stack_limit") int stackLimit,
            @JsonProperty("max_processes_and_or_threads") int maxProcesses,
            @JsonProperty("max_file_size") int maxFileSize,
            @JsonProperty("number_of_runs") int numberOfRuns,
            @JsonProperty("enable_per_process_and_thread_time_limit") boolean perProcessTimeLimit,
            @JsonProperty("enable_per_process_and_thread_memory_limit") boolean perProcessMemoryLimit,
            @JsonProperty("enable_network") boolean enableNetwork) {
        private Judge0Request(int languageId, String sourceCode) {
            this(languageId, sourceCode, 2.0, 0.5, 5.0, 128_000, 64_000, 30, 1024, 1, true, true, false);
        }
    }
    private record Judge0Status(int id, String description) { }
    private record Judge0Response(
            @JsonProperty("stdout") String stdout,
            @JsonProperty("stderr") String stderr,
            @JsonProperty("compile_output") String compileOutput,
            @JsonProperty("status") Judge0Status status,
            @JsonProperty("time") String time,
            @JsonProperty("memory") Long memory,
            @JsonProperty("message") String message) { }

    public record VisibleCaseResult(int testNumber, boolean passed, String expectedOutput, String actualOutput) { }
    public record CodeRunResult(String status, boolean passed, List<VisibleCaseResult> visibleTests,
            int hiddenPassed, int hiddenTotal, String message, String time, Long memory) { }
}

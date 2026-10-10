package com.intervuai.backend.service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.intervuai.backend.model.QuestionBank;

@Service
public class ExcelImportService {

    private final QuestionBankImportService importService;

    public ExcelImportService(QuestionBankImportService importService) {
        this.importService = importService;
    }

    public int importQuestions() {
        ClassPathResource resource = new ClassPathResource("IntervuAI_DSA_Question_Bank.xlsx");
        if (!resource.exists()) {
            throw new IllegalStateException("DSA question workbook is missing from the application resources.");
        }

        try (InputStream inputStream = resource.getInputStream(); Workbook workbook = new XSSFWorkbook(inputStream)) {
            Sheet sheet = workbook.getSheetAt(0);
            List<QuestionBank> questions = new ArrayList<>();
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                QuestionBank question = new QuestionBank();
                question.setInterviewType(getCellValue(row, 0));
                question.setTopic(getCellValue(row, 1));
                question.setDifficulty(getCellValue(row, 2));
                question.setTitle(getCellValue(row, 3));
                question.setCompanies(getCellValue(row, 4));
                question.setFrequency(getCellValue(row, 5));
                question.setProblemStatement(getCellValue(row, 6));
                question.setExpectedAnswer(getCellValue(row, 7));
                question.setExpectedApproach(getCellValue(row, 8));
                question.setKeyConcepts(getCellValue(row, 9));
                question.setSampleInput(getCellValue(row, 10));
                question.setSampleOutput(getCellValue(row, 11));
                question.setTimeComplexity(getCellValue(row, 12));
                question.setSpaceComplexity(getCellValue(row, 13));
                question.setTags(getCellValue(row, 14));
                questions.add(question);
            }
            return importService.importMissing(questions);
        } catch (Exception e) {
            throw new IllegalStateException("Could not import DSA questions from the workbook.", e);
        }
    }

    private String getCellValue(Row row, int columnIndex) {

        if (row.getCell(columnIndex) == null) {
            return "";
        }

        return row.getCell(columnIndex).toString().trim();
    }
}

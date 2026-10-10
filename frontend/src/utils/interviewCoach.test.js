import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chooseAdaptiveQuestions, chooseHrQuestions, getSkillLevel } from "./interviewCoach.js";

describe("interview coaching helpers", () => {
  it("maps score bands to clear skill recommendations", () => {
    assert.equal(getSkillLevel(9), "Interview ready");
    assert.equal(getSkillLevel(8), "Strong");
    assert.equal(getSkillLevel(6), "Building");
    assert.equal(getSkillLevel(5.9), "Needs practice");
  });

  it("builds an HR set with an introduction and broad behavioral coverage", () => {
    const topics = [
      "Introduction", "Motivation & Fit", "Strengths & Growth", "Teamwork & Collaboration",
      "Adaptability & Problem Solving", "Communication & Service", "Work Style & Values",
    ];
    const questions = topics.map((topic, index) => ({ id: index, topic, title: `Question ${index}` }));
    const selected = chooseHrQuestions(questions, "test-user");

    assert.equal(selected.length, 7);
    assert.equal(selected[0].topic, "Introduction");
    assert.deepEqual(new Set(selected.map((question) => question.topic)), new Set(topics));
  });

  it("returns no more than the requested number of distinct adaptive questions", () => {
    const questions = Array.from({ length: 12 }, (_, index) => ({
      id: index,
      topic: `Topic ${index}`,
      title: `Question ${index}`,
    }));

    const selected = chooseAdaptiveQuestions(questions, 5, "new-user");
    assert.equal(selected.length, 5);
    assert.equal(new Set(selected.map((question) => question.id)).size, 5);
    assert.ok(selected.every((question) => questions.includes(question)));
  });

  it("adjusts practice difficulty using saved topic scores", () => {
    const questions = [
      { id: 1, topic: "Arrays", difficulty: "Easy" },
      { id: 2, topic: "Arrays", difficulty: "Medium" },
      { id: 3, topic: "Arrays", difficulty: "Hard" },
    ];

    assert.equal(chooseAdaptiveQuestions(questions, 1, "user", { Arrays: 3 })[0].difficulty, "Easy");
    assert.equal(chooseAdaptiveQuestions(questions, 1, "user", { Arrays: 9 })[0].difficulty, "Hard");
  });
});

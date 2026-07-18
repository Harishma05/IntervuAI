import InterviewCard from "../components/InterviewCard";

function InterviewSetup() {
  return (
  <div className="card-container">
  <InterviewCard
    title="💼 HR Interview"
    description="Behavioral and Communication Questions"
  />

  <InterviewCard
    title="💻 DSA Interview"
    description="Arrays, Trees, Graphs and Algorithms"
  />

  <InterviewCard
    title="☕ Java Interview"
    description="OOP, Collections and Multithreading"
  />

  <InterviewCard
    title="📄 Resume Interview"
    description="AI asks questions from your resume"
  />
</div>
    

     
  );
}

export default InterviewSetup;
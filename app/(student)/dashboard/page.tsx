"use client";

import Link from "next/link";

// Mock Data
const RECOMMENDED_TUTORS = [
  { id: "omkar", name: "Omkar Shinde", subject: "English", board: "MSBSHSE", grade: "Grade 9-12" },
  { id: "rutuja", name: "Rutuja Patil", subject: "Mathematics", board: "MSBSHSE", grade: "Grade 9-12" },
  { id: "ashwini", name: "Ashwini Phadke", subject: "Physics", board: "MSBSHSE", grade: "Grade 9-12" },
];

const TOP_TUTORS = [
  { id: "omkar", name: "Omkar Shinde", subject: "English", board: "MSBSHSE", grade: "Grade 9-12" },
  { id: "ninad", name: "Ninad Gaikwad", subject: "Geography", board: "MSBSHSE", grade: "Grade 9-12" },
  { id: "swapnil", name: "Swapnil Bhise", subject: "Philosophy", board: "MSBSHSE", grade: "Grade 9-12" },
  { id: "rutuja", name: "Rutuja Patil", subject: "Mathematics", board: "MSBSHSE", grade: "Grade 9-12" },
  { id: "pranjal", name: "Pranjal Jadhav", subject: "Marathi", board: "MSBSHSE", grade: "Grade 9-12" },
  { id: "chinmay", name: "Chinmay Gharge", subject: "Economics", board: "MSBSHSE", grade: "Grade 9-12" },
  { id: "vaishnavi", name: "Vaishnavi Chavan", subject: "Political Science", board: "MSBSHSE", grade: "Grade 9-12" },
  { id: "abhishek", name: "Abhishek Pawar", subject: "Health & Physical Education", board: "MSBSHSE", grade: "Grade 9-12" },
  { id: "siddhi", name: "Siddhi Kadam", subject: "History", board: "MSBSHSE", grade: "Grade 9-12" },
  { id: "savita", name: "Savita Sonawane", subject: "Biology", board: "MSBSHSE", grade: "Grade 9-12" },
];

const TOOLS = [
  { name: "Flashcards", desc: "Generate interactive flashcards instantly", icon: "📇", path: "/tools/flashcards" },
  { name: "Quiz Me", desc: "Generate and analyze quizzes", icon: "📝", path: "/tools/quiz" },
  { name: "Mindmap", desc: "Create dynamic concept maps", icon: "🕸️", path: "/tools/mindmap" },
  { name: "Podcast Generator", desc: "Generate short educational podcasts", icon: "🎙️", path: "/tools/podcast" },
];

export default function Dashboard() {
  // Normally we would fetch the user profile here
  // mock user name for now
  const studentName = "Kamlesh";

  return (
    <div className="pb-20 text-white bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Hi {studentName}, how should we start</h1>

      {/* Recommended Tutors Section */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 text-gray-300">Recommended Tutors</h2>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {RECOMMENDED_TUTORS.map(tutor => (
            <div key={tutor.id} className="min-w-[280px] bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-teal-500 transition cursor-pointer flex flex-col">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-600 mr-4"></div>
                <div>
                  <h3 className="font-bold">{tutor.name}</h3>
                  <p className="text-xs text-gray-400">{tutor.subject} • {tutor.board} • {tutor.grade}</p>
                </div>
              </div>
              <div className="mt-auto flex gap-2">
                <Link href={`/tutor/${tutor.id}/chat`} className="flex-1 text-center py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition">
                  Chat Lesson
                </Link>
                <Link href={`/tutor/${tutor.id}/live`} className="flex-1 text-center py-2 bg-teal-600 hover:bg-teal-500 text-white rounded text-sm font-medium transition">
                  Live Class
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tools Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-300">Tools</h2>
          <span className="text-sm text-teal-400 cursor-pointer">View all</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TOOLS.map(tool => (
            <Link href={tool.path} key={tool.name} className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-teal-500 transition group">
              <div className="text-3xl mb-3">{tool.icon}</div>
              <h3 className="font-bold mb-2 group-hover:text-teal-400 transition">{tool.name}</h3>
              <p className="text-sm text-gray-400">{tool.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Top Tutors by Subject */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 text-gray-300">Top Tutors by Subject</h2>

        {/* Subjects Tabs */}
        <div className="flex gap-4 overflow-x-auto mb-6 text-sm whitespace-nowrap pb-2">
          <button className="px-4 py-2 bg-gray-800 text-white rounded-full border border-teal-500 font-medium">All</button>
          <button className="px-4 py-2 bg-gray-900 text-gray-400 hover:text-white rounded-full transition">Biology</button>
          <button className="px-4 py-2 bg-gray-900 text-gray-400 hover:text-white rounded-full transition">Chemistry</button>
          <button className="px-4 py-2 bg-gray-900 text-gray-400 hover:text-white rounded-full transition">Economics</button>
          <button className="px-4 py-2 bg-gray-900 text-gray-400 hover:text-white rounded-full transition">English</button>
          <button className="px-4 py-2 bg-gray-900 text-gray-400 hover:text-white rounded-full transition">Geography</button>
          <button className="px-4 py-2 bg-gray-900 text-gray-400 hover:text-white rounded-full transition">Health & Physical Education</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TOP_TUTORS.map(tutor => (
            <div key={tutor.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-teal-500 transition cursor-pointer flex flex-col">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-600 mr-4"></div>
                <div>
                  <h3 className="font-bold">{tutor.name}</h3>
                  <p className="text-xs text-gray-400">{tutor.subject} • {tutor.board} • {tutor.grade}</p>
                </div>
              </div>
              <div className="mt-auto flex gap-2">
                <Link href={`/tutor/${tutor.id}/chat`} className="flex-1 text-center py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition">
                  Chat Lesson
                </Link>
                <Link href={`/tutor/${tutor.id}/live`} className="flex-1 text-center py-2 bg-teal-600 hover:bg-teal-500 text-white rounded text-sm font-medium transition">
                  Live Class
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

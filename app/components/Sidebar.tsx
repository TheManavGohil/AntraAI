"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Explore Tutors", path: "/dashboard", icon: "🔍" },
    { name: "Custom Tools", path: "/tools", icon: "🛠️" },
    { name: "My Space", path: "/mastery", icon: "📂" },
    { name: "Help & Support", path: "/help", icon: "❓" },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen hidden md:flex flex-col border-r border-gray-800">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-teal-400">YoLearn</h1>
      </div>
      <nav className="flex-1 mt-6">
        <ul className="space-y-2 px-4">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.path
                    ? "bg-gray-800 text-teal-400 font-semibold"
                    : "hover:bg-gray-800 text-gray-300"
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-800 text-sm text-gray-500">
        © 2024 YoLearn
      </div>
    </aside>
  );
}

import { redirect } from "next/navigation";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">
        Welcome to PHC Medical Record Dashboard
      </h1>
      <div className="flex space-x-4">
        <a
          href="/login"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Login
        </a>
      </div>
    </div>
  );
}

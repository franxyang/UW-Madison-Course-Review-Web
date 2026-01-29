export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-uw-red mb-4">
          WiscFlow
        </h1>
        <p className="text-lg text-slate-600">
          UW Madison Course Reviews & Academic Planning
        </p>
        <div className="mt-8">
          <a
            href="/courses"
            className="inline-block bg-uw-red text-white px-6 py-3 rounded-lg hover:bg-uw-dark transition-colors font-medium"
          >
            Browse Courses
          </a>
        </div>
      </div>
    </div>
  )
}
export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to TeleHealth Platform
          </h1>
          <p className="text-xl text-gray-600">
            Connect with healthcare providers from the comfort of your home
          </p>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Patient Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-medical-100">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-medical-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-medical-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">I'm a Patient</h2>
              <p className="text-gray-600">Get medical consultations online</p>
            </div>
            <div className="space-y-3">
              <a href="/patient/login" className="block w-full bg-medical-600 text-white text-center py-3 px-4 rounded-lg hover:bg-medical-700 transition">
                Login to Patient Portal
              </a>
              <a href="/patient/register" className="block w-full border-2 border-medical-600 text-medical-600 text-center py-3 px-4 rounded-lg hover:bg-medical-50 transition">
                Register as New Patient
              </a>
            </div>
          </div>

          {/* Provider Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-health-100">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-health-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-health-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">I'm a Provider</h2>
              <p className="text-gray-600">Manage consultations and patients</p>
            </div>
            <div className="space-y-3">
              <a href="/provider/login" className="block w-full bg-health-600 text-white text-center py-3 px-4 rounded-lg hover:bg-health-700 transition">
                Login to Provider Portal
              </a>
              <a href="/provider/register" className="block w-full border-2 border-health-600 text-health-600 text-center py-3 px-4 rounded-lg hover:bg-health-50 transition">
                Apply as Provider
              </a>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-gray-50 rounded-lg p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Platform Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Real-time Messaging</h4>
              <p className="text-sm text-gray-600">Chat with healthcare providers instantly</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Secure & HIPAA Compliant</h4>
              <p className="text-sm text-gray-600">Your health data is protected</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Digital Prescriptions</h4>
              <p className="text-sm text-gray-600">Get prescriptions sent to your pharmacy</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600">
          <p>&copy; 2025 TeleHealth Platform. All rights reserved.</p>
        </div>
      </div>
    </main>
  )
}

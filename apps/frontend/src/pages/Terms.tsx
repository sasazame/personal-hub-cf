import { Link } from 'react-router-dom';

export function Terms() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#1a1b3a] via-[#2d2b5f] to-[#16213e] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-white/60 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-white/80 mb-6">
            Welcome to Personal Hub. These terms of service ("Terms") govern your use of our service.
          </p>
          
          <h2 className="text-2xl font-semibold mt-6 mb-4 text-white">1. Acceptance of Terms</h2>
          <p className="text-white/80 mb-6">
            By accessing or using Personal Hub, you agree to be bound by these Terms.
          </p>
          
          <h2 className="text-2xl font-semibold mt-6 mb-4 text-white">2. Use of Service</h2>
          <p className="text-white/80 mb-6">
            You may use our service for lawful purposes only. You agree not to use the service to violate any laws or regulations.
          </p>
          
          <h2 className="text-2xl font-semibold mt-6 mb-4 text-white">3. Privacy</h2>
          <p className="text-white/80 mb-6">
            Your privacy is important to us. Please review our Privacy Policy to understand how we collect and use information.
          </p>
        </div>
        
        <div className="mt-12">
          <Link 
            to="/register" 
            className="text-blue-300 hover:text-blue-200 transition-colors"
          >
            ← Back to Registration
          </Link>
        </div>
      </div>
    </div>
  );
}
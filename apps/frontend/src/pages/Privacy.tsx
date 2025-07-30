import { Link } from 'react-router-dom';

export function Privacy() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#1a1b3a] via-[#2d2b5f] to-[#16213e] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-white/60 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-white/80 mb-6">
            Personal Hub ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information.
          </p>
          
          <h2 className="text-2xl font-semibold mt-6 mb-4 text-white">1. Information We Collect</h2>
          <p className="text-white/80 mb-6">
            We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.
          </p>
          
          <h2 className="text-2xl font-semibold mt-6 mb-4 text-white">2. How We Use Your Information</h2>
          <p className="text-white/80 mb-6">
            We use the information we collect to provide, maintain, and improve our services, communicate with you, and protect our users.
          </p>
          
          <h2 className="text-2xl font-semibold mt-6 mb-4 text-white">3. Data Security</h2>
          <p className="text-white/80 mb-6">
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
          </p>
          
          <h2 className="text-2xl font-semibold mt-6 mb-4 text-white">4. Contact Us</h2>
          <p className="text-white/80 mb-6">
            If you have any questions about this Privacy Policy, please contact us.
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
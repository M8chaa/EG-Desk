import React from 'react';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-6">Welcome to Our App</h1>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl">
        Your intelligent audio processing and transcription solution
      </p>
      <div className="space-y-4">
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg">
          Get Started
        </button>
      </div>
    </div>
  );
};

export default LandingPage; 
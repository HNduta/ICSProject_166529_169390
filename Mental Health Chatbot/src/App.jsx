import React from 'react';
import MoodSelector from './MoodSelector';

function App() {
  return (
    <div
      style={{
        padding: '2rem',
        fontFamily: 'sans-serif',
        textAlign: 'center',
        backgroundColor: '#f9fafb', // Light background
        minHeight: '100vh',
        color: '#111827' // Dark gray text
      }}
    >
      <MoodSelector />
      <h1>Hello from Kiafya 👋</h1>
      <p>This is your chatbot landing page.</p>
    </div>
  );
}

export default App;

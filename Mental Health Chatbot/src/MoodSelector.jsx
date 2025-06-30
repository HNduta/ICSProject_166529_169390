import React, { useState } from 'react';

const moods = [
  { label: 'Happy', emoji: '😊', value: 'happy' },
  { label: 'Low', emoji: '😔', value: 'low' },
  { label: 'Umejam', emoji: '🥱', value: 'umejam' },
  { label: 'Stressed', emoji: '🤯', value: 'stressed' },
  { label: 'Niko vibes', emoji: '😎', value: 'niko_vibes' },
];

const MoodSelector = () => {
  const [selectedMood, setSelectedMood] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedMood) {
      alert(`You selected: ${selectedMood}`);
    } else {
      alert('Please select a mood before submitting.');
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center px-4 py-8">
      <h1 className="text-xl sm:text-2xl font-semibold text-center text-gray-800 mb-6">
        Please select your mood by clicking on one of the options.
      </h1>

      <form className="w-full max-w-md space-y-4" onSubmit={handleSubmit}>
        {moods.map((mood, index) => (
          <label
            key={mood.value}
            className={`flex items-center justify-between bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition duration-200 cursor-pointer border ${
              selectedMood === mood.value ? 'border-blue-500' : 'border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="mood"
                value={mood.value}
                checked={selectedMood === mood.value}
                onChange={() => setSelectedMood(mood.value)}
                className="form-radio h-5 w-5 text-blue-600"
              />
              <span className="text-2xl">{mood.emoji}</span>
              <span className="text-gray-700 font-medium">
                {`${index + 1}. ${mood.label}`}
              </span>
            </div>
          </label>
        ))}

        <button
          type="submit"
          className="w-full py-3 px-6 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
        >
          Submit Mood
        </button>
      </form>
    </div>
  );
};

export default MoodSelector;

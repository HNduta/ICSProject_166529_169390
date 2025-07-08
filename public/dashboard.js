// public/dashboard.js
// Wrapped in an IIFE to prevent global variable conflicts, especially 'currentDate'
(function() {
    console.log("****** dashboard.js IS HERE AND EXECUTING! ******");

    // Function to fetch mood data and draw the chart
    async function fetchAndDrawMoodChart() {
        const userId = localStorage.getItem("userId");
        const moodChartCanvas = document.getElementById("moodChart");
        const moodChartMessage = document.getElementById("mood-chart-message");

        if (!moodChartCanvas) {
            console.error("Mood chart canvas not found!");
            return;
        }

        const ctx = moodChartCanvas.getContext('2d');

        if (!userId || userId === "default-user") {
            console.warn("User ID not found in localStorage or is default. Cannot fetch mood data.");
            ctx.clearRect(0, 0, moodChartCanvas.width, moodChartCanvas.height);
            moodChartMessage.textContent = "Please log in to see your mood analysis.";
            if (window.moodChartInstance) {
                window.moodChartInstance.destroy();
                window.moodChartInstance = null;
            }
            return;
        }

        moodChartMessage.textContent = "Loading mood data...";

        try {
            const res = await fetch(`/api/moods/user/${userId}`);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(`HTTP error! status: ${res.status}, Message: ${errorData.message || res.statusText}`);
            }
            const data = await res.json();
            console.log("Fetched mood data:", data);

            if (data.length === 0) {
                console.log("No mood data available for this user.");
                ctx.clearRect(0, 0, moodChartCanvas.width, moodChartCanvas.height);
                moodChartMessage.textContent = "No mood data yet. Log your first mood!";
                if (window.moodChartInstance) {
                    window.moodChartInstance.destroy();
                    window.moodChartInstance = null;
                }
                return;
            }

            data.sort((a, b) => new Date(a.date) - new Date(b.date));
            const moods = data.map(entry => entry.mood);
            const dates = data.map(entry =>
                new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            );

            if (window.moodChartInstance) {
                window.moodChartInstance.destroy();
            }

            window.moodChartInstance = new Chart(ctx, {
                type: "line",
                data: {
                    labels: dates,
                    datasets: [{
                        label: "Mood Over Time",
                        data: moods.map(m => moodToNumeric(m)),
                        borderColor: "#4f46e5",
                        backgroundColor: "rgba(79, 70, 229, 0.1)",
                        tension: 0.3,
                        fill: true,
                        pointBackgroundColor: "#4f46e5",
                        pointBorderColor: "#fff",
                        pointHoverBackgroundColor: "#3b82f6",
                        pointHoverBorderColor: "#fff",
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const moodValue = context.raw;
                                    const reverseScale = {
                                        1: 'Sad', 2: 'Anxious', 3: 'Neutral', 4: 'Calm', 5: 'Happy'
                                    };
                                    return `Mood: ${reverseScale[moodValue] || 'N/A'}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            beginAtZero: true,
                            max: 5,
                            min: 1,
                            ticks: {
                                callback: function(value) {
                                    const reverseScale = {
                                        1: 'Sad', 2: 'Anxious', 3: 'Neutral', 4: 'Calm', 5: 'Happy'
                                    };
                                    return reverseScale[value] || '';
                                },
                                stepSize: 1
                            },
                            grid: {
                                color: "#e2e8f0"
                            }
                        }
                    }
                }
            });

            moodChartMessage.textContent = "";
        } catch (error) {
            console.error("Error fetching mood data or rendering chart:", error);
            ctx.clearRect(0, 0, moodChartCanvas.width, moodChartCanvas.height);
            moodChartMessage.textContent = "Error loading mood analysis. Please try again later.";
            if (window.moodChartInstance) {
                window.moodChartInstance.destroy();
                window.moodChartInstance = null;
            }
        }
    }

    function moodToNumeric(mood) {
        const scale = {
            Happy: 5, Calm: 4, Neutral: 3, Anxious: 2, Sad: 1,
            Angry: 1.5, Excited: 4.5, Bored: 2.5, Confused: 2.8,
            Motivated: 4.8, Stressed: 1.8, Relaxed: 3.5
        };
        return scale[mood] || 0;
    }

    // Calendar Logic
    let currentDate = new Date();

    function getWeekDays(date) {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            days.push(day);
        }
        return days;
    }

    function updateCalendar(date) {
        const calendarDisplay = document.getElementById('calendar-display');
        if (!calendarDisplay) return;

        calendarDisplay.innerHTML = '';
        const weekDays = getWeekDays(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        weekDays.forEach(day => {
            const dayDiv = document.createElement('div');
            const isSelected = day.toDateString() === today.toDateString();
            dayDiv.className = `calendar-day flex-shrink-0 ${
                isSelected ? 'selected' : 'bg-gray-100'
            }`;
            dayDiv.innerHTML = `
                <span class="uppercase text-xs font-medium">${day.toLocaleString('en-US', { weekday: 'short' })}</span>
                <span class="day-num">${day.getDate()}</span>
            `;
            dayDiv.addEventListener('click', () => {
                document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                dayDiv.classList.add('selected');
            });
            calendarDisplay.appendChild(dayDiv);
        });
    }

    async function fetchLatestJournalEntry() {
        const userId = localStorage.getItem('userId');
        const latestJournalPreview = document.getElementById('latest-journal-preview');
        if (!latestJournalPreview) return;

        if (!userId) {
            latestJournalPreview.textContent = "Please log in to see your journal preview.";
            return;
        }

        try {
            const res = await fetch(`/api/journal/user/${userId}?limit=1&sort=-date`);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(`HTTP error! status: ${res.status}, Message: ${errorData.message || res.statusText}`);
            }
            const data = await res.json();

            if (data && data.length > 0) {
                const latestEntry = data[0];
                const previewText = latestEntry.content.substring(0, 70);
                latestJournalPreview.textContent = `"${previewText}${latestEntry.content.length > 70 ? '...' : ''}"`;
            } else {
                latestJournalPreview.textContent = "No recent entries. Start journaling today!";
            }
        } catch (error) {
            console.error("Error fetching latest journal entry:", error);
            latestJournalPreview.textContent = "Error loading journal preview.";
        }
    }

    // Expose functions globally if needed
    window.fetchAndDrawMoodChart = fetchAndDrawMoodChart;
    window.updateCalendar = updateCalendar;
    window.currentDate = currentDate;
    window.fetchLatestJournalEntry = fetchLatestJournalEntry;

    // DOMContentLoaded initialization
    document.addEventListener('DOMContentLoaded', () => {
        const prevWeekButton = document.getElementById('prev-week');
        const nextWeekButton = document.getElementById('next-week');

        if (prevWeekButton) {
            prevWeekButton.addEventListener('click', () => {
                currentDate.setDate(currentDate.getDate() - 7);
                updateCalendar(currentDate);
            });
        }

        if (nextWeekButton) {
            nextWeekButton.addEventListener('click', () => {
                currentDate.setDate(currentDate.getDate() + 7);
                updateCalendar(currentDate);
            });
        }

        const homeNavItem = document.querySelector('.nav-item[data-target="home-section"]');
        if (homeNavItem) {
            homeNavItem.classList.add('text-blue-600');
            homeNavItem.classList.remove('text-gray-500', 'hover:text-blue-600');
        }

        updateCalendar(currentDate);
        const userName = localStorage.getItem("userName");
        const welcomeMessageElement = document.getElementById('welcome-message');
        if (welcomeMessageElement) {
            if (userName) {
                welcomeMessageElement.textContent = `Welcome back, ${userName}!`;
            } else {
                const userId = localStorage.getItem("userId");
                welcomeMessageElement.textContent = userId ? `Welcome back, User!` : `Welcome, Guest!`;
            }
        }

        fetchAndDrawMoodChart();
        fetchLatestJournalEntry();
    });

    window.updateWelcomeMessage = function(newName) {
        const welcomeMessageElement = document.getElementById('welcome-message');
        if (welcomeMessageElement) {
            welcomeMessageElement.textContent = `Welcome back, ${newName}!`;
        }
    };
})();

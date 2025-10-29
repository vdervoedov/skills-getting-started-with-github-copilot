document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and existing UI
      activitiesList.innerHTML = "";

      // Reset select but keep placeholder option
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list HTML
        let participantsHtml = "";
        if (details.participants && details.participants.length > 0) {
          participantsHtml = `
            <div class="participants-list">
              <h5>Participants</h5>
              <ul>
                ${details.participants
                  .map((p) =>
                    `<li>
                        <span class="participant-chip">${escapeHtml(p)}</span>
                        <button class="participant-remove" data-activity="${escapeHtml(
                          name
                        )}" data-email="${escapeHtml(p)}" title="Unregister">\u00d7</button>
                      </li>`
                  )
                  .join("")}
              </ul>
            </div>
          `;
        } else {
          participantsHtml = `
            <div class="participants-list">
              <h5>Participants</h5>
              <ul>
                <li>No participants yet</li>
              </ul>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Attach click handlers to remove buttons for this activity
        const removeButtons = activityCard.querySelectorAll(".participant-remove");
        removeButtons.forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            const activityName = btn.dataset.activity;
            const email = btn.dataset.email;

            if (!activityName || !email) return;

            // Confirm action with the user
            const ok = confirm(`Remove ${email} from ${activityName}?`);
            if (!ok) return;

            try {
              const res = await fetch(
                `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(
                  email
                )}`,
                { method: "POST" }
              );

              const data = await res.json();
              if (res.ok) {
                // Refresh activities to reflect change
                fetchActivities();
                messageDiv.textContent = data.message || "Participant removed";
                messageDiv.className = "success";
                messageDiv.classList.remove("hidden");
                setTimeout(() => messageDiv.classList.add("hidden"), 4000);
              } else {
                messageDiv.textContent = data.detail || "Failed to remove participant";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
              }
            } catch (err) {
              console.error("Error removing participant:", err);
              messageDiv.textContent = "Failed to remove participant. Please try again.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // simple HTML-escape to avoid injecting raw values
  function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities so participant list updates. Await to ensure UI updates before continuing.
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

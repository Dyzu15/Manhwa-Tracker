document.getElementById("profileBtn")?.addEventListener("click", () => {
    const user = firebase.auth().currentUser;
    if (!user) return alert("Please log in first.");
  
    document.getElementById("profilePic").src = user.photoURL || "";
    document.getElementById("profileName").textContent = user.displayName || "User";
  
    const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    const statusMap = JSON.parse(localStorage.getItem("statuses") || "{}");
  
    const counts = {
      completed: 0,
      dropped: 0,
      on_hold: 0,
      wishlist: 0
    };
  
    for (const id in statusMap) {
      if (statusMap[id] === "completed") counts.completed++;
      if (statusMap[id] === "dropped") counts.dropped++;
      if (statusMap[id] === "on_hold") counts.on_hold++;
      if (statusMap[id] === "wishlist") counts.wishlist++;
    }
  
    document.getElementById("profileBookmarked").textContent = bookmarks.length;
    document.getElementById("profileCompleted").textContent = counts.completed;
    document.getElementById("profileDropped").textContent = counts.dropped;
    document.getElementById("profileOnHold").textContent = counts.on_hold;
    document.getElementById("profileWishlist").textContent = counts.wishlist;
  
    document.getElementById("profileModal").classList.remove("hidden");
  });
  
  function closeProfile() {
    document.getElementById("profileModal").classList.add("hidden");
  }
  
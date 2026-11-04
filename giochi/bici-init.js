// Mark cached images as loaded so the photo replaces its fallback illustration.
document.querySelectorAll(".pic img").forEach((image) => {
  if (image.complete && image.naturalWidth) {
    image.parentNode.classList.add("has-photo");
  }
});

const path = require("path");
const { getStore } = require("@netlify/blobs");

function getUploadStore() {
  return getStore("complaint-uploads");
}

function getUploadKey(photo) {
  if (typeof photo !== "string" || !photo.startsWith("/uploads/")) return null;
  const key = photo.slice("/uploads/".length);
  if (!key || key !== path.basename(key) || !/^[a-zA-Z0-9._-]+$/.test(key)) return null;
  return key;
}

module.exports = { getUploadKey, getUploadStore };
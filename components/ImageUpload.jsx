"use client";

export default function ImageUpload({ onUpload }) {
  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.url) {
      onUpload(data.url);
    }
  }

  return (
    <input
      type="file"
      onChange={handleUpload}
      className="w-full text-sm"
    />
  );
}
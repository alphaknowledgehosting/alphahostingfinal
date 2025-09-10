// src/suppressConsole.js
if (process.env.NODE_ENV === 'production') {
  console.error = () => {};
  console.warn = () => {};
}

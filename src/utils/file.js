/**
 * Catches the change event from <input type="file"> and reads the result file
 * into a base64 data URL.
 *
 * @example
 * readInputFile(event).then(file => console.log(file));
 * // "data:image/png;base64..."
 *
 * @param {Event} event - Change event from <input type="file">.
 * @return {Promise<string, Error>} Resolves to a base64 data URL.
 */
export const readInputFile = (event, type = 'dataURL') => {
  return new Promise((resolve, reject) => {
    if (!event.target.files || !event.target.files[0]) {
      reject(new Error('No file chosen.'));
    }

    const reader = new window.FileReader();
    reader.onload = e => resolve(e.target.result);

    if (type === 'dataURL') {
      reader.readAsDataURL(event.target.files[0]);
    } else if (type === 'binary') {
      reader.readAsBinaryString(event.target.files[0]);
    } else if (type === 'text') {
      reader.readAsText(event.target.files[0]);
    }
  });
};

export const convertFileToDataURL = file => {
  return new Promise((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
};

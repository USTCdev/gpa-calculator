import { Course } from "./course";
import { dump, load } from "./json";

export async function saveToFile(courses: Course[]) {
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: "Untitled.ustcgpa",
      types: [
        {
          description: "USTC GPA Data",
          accept: {
            "application/json": [".ustcgpa"],
          },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(dump(courses));
    await writable.close();
  } catch (e: any) {
    if (e.name !== "AbortError") alert(e);
  }
}

export async function loadFromFile() {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: "USTC GPA Data",
          accept: {
            "application/json": [".ustcgpa"],
          },
        },
      ],
    });
    const file = await handle.getFile();
    return load(await file.text());
  } catch (e: any) {
    if (e.name !== "AbortError") alert(e);
    throw e;
  }
}

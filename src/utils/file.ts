import { version } from "./constants";
import { Course } from "./course";

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
    await writable.write(JSON.stringify({ version, courses }, null, 2));
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
    const json = JSON.parse(await file.text());
    if (json.version === 1) {
      return json.courses.map(
        ({ name, id, hour, credits, score }: Partial<Course>) =>
          new Course(name, id, hour, credits, score),
      );
    } else {
      throw new Error("导入失败，版本不匹配");
    }
  } catch (e: any) {
    if (e.name !== "AbortError") alert(e);
    throw e;
  }
}

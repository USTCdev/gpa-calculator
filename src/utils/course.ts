import { levelMap } from "./constants";


export type Level = keyof typeof levelMap | "F";

export const passSym = Symbol("通过");
export const failSym = Symbol("不通过");

export type Score = number | Level | typeof passSym | typeof failSym;

export class Course {
  constructor(
    public name: string = "",
    public id: string = "",
    public hour: number = 120,
    public credits: number = 6,
    public score: Score = 100,
  ) {}

  get level() {
    if (typeof this.score === "string") return this.score;
    if (typeof this.score === "symbol")
      return this.score === passSym ? "P" : "F";
    for (const [level, [min]] of Object.entries(levelMap)) {
      if (this.score >= min) return level as Level;
    }
    return "F";
  }

  get gpa() {
    return levelMap[this.level][2];
  }

  get gpaStr() {
    return typeof this.score === "symbol" ? "" : `${this.gpa}`;
  }

  get point() {
    if (typeof this.score === "number") return this.score;
    else return levelMap[this.level][1];
  }

  get pass() {
    return this.level !== "F";
  }

  get scoreStr() {
    if (typeof this.score === "number") return this.score.toString();
    else if (typeof this.score === "symbol")
      return this.score === passSym ? "通过" : "不通过";
    else return this.score;
  }

  clone() {
    return new Course(this.name, this.id, this.hour, this.credits, this.score);
  }
}

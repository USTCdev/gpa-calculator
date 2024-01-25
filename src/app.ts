import {
  $app,
  $view,
  Context,
  Model,
  _,
  byIndex,
  componentRef,
  elementRef,
  model,
  propModel,
} from "refina";
import Basics from "@refina/basic-components";
import FluentUI, { webDarkTheme, webLightTheme } from "@refina/fluentui";
import { FiDismiss16Filled } from "@refina/fluentui-icons/dismiss";
import { FiAdd16Filled } from "@refina/fluentui-icons/add";
import { FiInfo12Regular } from "@refina/fluentui-icons/info";
import "./styles.css";

const levelMap = {
  "A+": [95, 98, 4.3],
  A: [90, 93, 4],
  "A-": [85, 88, 3.7],
  "B+": [82, 84, 3.3],
  B: [78, 80, 3],
  "B-": [75, 77, 2.7],
  "C+": [72, 74, 2.3],
  C: [68, 70, 2],
  "C-": [65, 67, 1.7],
  "D+": [64, 65, 1.5],
  D: [61, 63, 1.3],
  "D-": [60, 61, 1],
  F: [0, NaN, 0],
  P: [0, NaN, 0],
} as const;
type Level = keyof typeof levelMap | "F";

const pass = Symbol("通过");
const notPass = Symbol("不通过");

type Score = number | Level | typeof pass | typeof notPass;

class Course {
  constructor(
    public name: string = "",
    public id: string = "",
    public hour: number = 2,
    public credits: number = 1,
    public score: Score = 100,
  ) {}

  get level() {
    if (typeof this.score === "string") return this.score;
    if (typeof this.score === "symbol") return this.score === pass ? "P" : "F";
    for (const [level, [min]] of Object.entries(levelMap)) {
      if (this.score >= min) return level as Level;
    }
    return "F";
  }

  get gpa() {
    return levelMap[this.level][2];
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
      return this.score === pass ? "通过" : "不通过";
    else return this.score;
  }
}

let courses: Course[] = [];

function getOverview() {
  const calculatedCourses = courses.filter(c => typeof c.score !== "symbol");
  const calculatedCredits = calculatedCourses.reduce(
    (a, b) => a + b.credits,
    0,
  );
  return {
    总学分: courses.reduce((a, b) => a + b.credits, 0),
    已获学分: courses.filter(c => c.pass).reduce((a, b) => a + b.credits, 0),
    不及格学分: courses.filter(c => !c.pass).reduce((a, b) => a + b.credits, 0),
    GPA:
      calculatedCourses.reduce((a, b) => a + b.gpa * b.credits, 0) /
      calculatedCredits,
    加权平均分:
      calculatedCourses.reduce((a, b) => a + b.point * b.credits, 0) /
      calculatedCredits,
    算术平均分:
      calculatedCourses.reduce((a, b) => a + b.point, 0) /
      calculatedCourses.length,
  };
}

const sectionRef = elementRef<"section">();

const OutputFragment = (_: Context) => {
  _.$cls`overview`;
  _.div(_ =>
    _.ul(Object.entries(getOverview()), byIndex, ([k, v]) => {
      _.li(_ => {
        _.span(k);
        _.span(Math.round(v * 100) / 100);
      });
    }),
  );

  _.$cls`semesters`;
  _.div(
    _ =>
      _.$ref(sectionRef) &&
      _.$cls`schoolYear` &&
      _._section(
        {},
        _ =>
          _.$cls`semester` &&
          _.div(_ => {
            _.h4("2023年秋季学期");
            _.$cls`course-table table table-bordered table-striped table-hover table-condensed`;
            _.table(
              courses,
              _ =>
                _.$cls`table-head` &&
                _._tr({}, _ => {
                  _._th({}, "课程");
                  _._th({}, "学时");
                  _._th({}, "学分");
                  _._th({}, "绩点");
                  _._th({}, "成绩");
                }),
              "id",
              course => {
                _.$cls`course-name hover:underline hover:text-blue-600`;
                _._td(
                  {
                    onclick: () => {
                      selected = course;

                      if (typeof course.score === "number") {
                        tabsRef.current!.activeTab = "百分制";
                        tempPoint.value = course.score;
                        tempLevel.value = course.level;
                        tempPass.value = course.pass;
                      } else if (typeof course.score === "string") {
                        tabsRef.current!.activeTab = "五等级制";
                        tempPoint.value = course.point;
                        tempLevel.value = course.score;
                        tempPass.value = course.pass;
                      } else {
                        tabsRef.current!.activeTab = "二等级制";
                        tempPoint.value = course.pass ? 100 : 0;
                        tempLevel.value = course.pass ? "A+" : "F";
                        tempPass.value = course.pass;
                      }

                      app.update();
                    },
                  },
                  _ => {
                    _.t(course.name);
                    _._small({}, course.id);
                  },
                );
                _.td(course.hour);
                _.td(course.credits);
                _.td(course.gpa);
                _.td(course.scoreStr);
              },
            );
          }),
      ),
  );
  if (_.$updateContext) {
    sectionRef.current!.node.dataset["name"] = "2023-2024";
  }
};

let selected = new Course();

const TextInput = $view((name: string, key: keyof Course) => {
  _.$cls`my-4`;
  _.div(_ => {
    _.$cls`block mb-0 mr-2 font-semibold text-xl`;
    _.label(name);
    _.fInput(propModel(selected, key) as Model<string>);
  });
});

const NumberInput = $view((name: string, key: keyof Course) => {
  _.$cls`my-4`;
  _.div(_ => {
    _.$cls`block mb-0 mr-2 font-semibold text-xl`;
    _.label(name);
    _.fNumberInput(propModel(selected, key) as Model<number>);
  });
});

const tabsRef = componentRef<"fTabs">();

const tempPoint = model(100);
const tempLevel = model<Level>("A+");
const tempPass = model(true);

const EditorFragment = (_: Context) => {
  _.$cls`flex gap-x-4 flex-wrap`;
  _.div(_ => {
    _.div(_ => {
      _(TextInput)("名称", "name");
      _(TextInput)("编号", "id");
    });
    _.div(_ => {
      _(NumberInput)("学时", "hour");
      _(NumberInput)("学分", "credits");
    });
    _.$ref(tabsRef);
    _.$css`padding:0;max-height:130px;min-height:110px`;
    if (
      _.fTabs(
        "百分制",
        _ => {
          _.fNumberInput(tempPoint);
        },
        "五等级制",
        _ => {
          _.fDropdown(tempLevel, Object.keys(levelMap).slice(0, -1));
        },
        "二等级制",
        _ => {
          _.fCheckbox("通过", tempPass);
        },
      )
    ) {
      if (_.$ev === "百分制") {
        selected.score = tempPoint.value;
      }
      if (_.$ev === "五等级制") {
        selected.score = tempLevel.value;
      }
      if (_.$ev === "二等级制") {
        selected.score = tempPass.value ? pass : notPass;
      }
    }
  });

  const exist = courses.findIndex(c => c === selected) !== -1;
  if (
    exist &&
    _.fButton(_ => {
      _.$cls`mr-4`;
      _(FiDismiss16Filled)();
      _.span("删除");
    })
  ) {
    courses = courses.filter(c => c.id !== selected.id);
    selected = new Course();
  }

  const valid =
    selected.name &&
    selected.id &&
    selected.hour &&
    selected.credits &&
    courses.findIndex(c => c.id === selected.id) === -1;

  if (
    !exist &&
    _.fPrimaryButton(_ => {
      _.$cls`mr-4`;
      _(FiAdd16Filled)();
      _.span("添加");
    }, !valid)
  ) {
    courses.push(selected);
    selected = new Course();
  }
};

const app = $app([Basics, FluentUI(webDarkTheme, webLightTheme)], _ => {
  _.$cls`flex flex-col min-h-screen px-12 pb-12`;
  _.div(_ => {
    _.$cls`flex items-start`;
    _.div(_ => {
      _.$cls`inline flex-grow font-extrabold text-6xl font-mono mt-6`;
      _.h1("USTC GPA Simulator");

      _.$cls`inline text-right font-mono h-0 overflow-visible mt-4`;
      _.div(_ => {
        _.p(_ => {
          _.t`By: `;
          _.$attrs({ target: "_blank" });
          _.a("_Kerman", "https://github.com/kermanx");
        });
        _.p(_ => {
          _.$attrs({ target: "_blank" });
          _.a("Repository", "https://github.com/USTCdev/gpa-calculator");
          _.$cls`ml-4`;
          _.$attrs({ target: "_blank" });
          _.a("Report", "https://github.com/USTCdev/gpa-calculator/issues/new");
        });
        _.p(_ => {
          _.t`Powered by `;
          _.$attrs({ target: "_blank" });
          _.a("Refina.js", "https://github.com/refinajs/refina");
        });
      });
    });

    _.$cls`text-4xl font-bold font-mono ml-1 mt-2`;
    _.h2("Editor");
    _.$cls`p-2 border-2 border-solid border-gray-500 rounded-md `;
    _.div(EditorFragment);

    _.$cls`text-4xl font-bold font-mono ml-1 mt-2`;
    _.h2(_ => {
      _.t`Preview`;
      _.$cls`inline text-xl ml-6 mr-1`;
      _(FiInfo12Regular)();
      _.$cls`font-normal text-xl font-sans`;
      _.span(
        courses.length
          ? "点击表格中的课程名称可以编辑数据哦"
          : "在上方编辑器中添加课程吧",
      );
    });
    _.$cls`p-14 flex-1 border-2 border-solid border-gray-500 rounded-md`;
    _.div(OutputFragment);
  });
});

declare module "refina" {
  interface Plugins {
    Basics: typeof Basics;
    FluentUI: typeof FluentUI;
  }
}

import Basics from "@refina/basic-components";
import FluentUI, { webDarkTheme, webLightTheme } from "@refina/fluentui";
import { FiAdd16Filled } from "@refina/fluentui-icons/add";
import { FiArrowImport20Filled } from "@refina/fluentui-icons/arrowImport";
import { FiCheckmark16Filled } from "@refina/fluentui-icons/checkmark";
import {
  FiDelete16Regular,
  FiDelete20Regular,
} from "@refina/fluentui-icons/delete";
import { FiDismiss16Filled } from "@refina/fluentui-icons/dismiss";
import { FiFolderOpen20Regular } from "@refina/fluentui-icons/folderOpen";
import { FiInfo12Regular, FiInfoRegular } from "@refina/fluentui-icons/info";
import { FiSave20Regular } from "@refina/fluentui-icons/save";
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
import "./styles.css";
import { version } from "./utils/constants";
import { Course, Level, levelMap, failSym, passSym } from "./utils/course";
import { loadFromFile, saveToFile } from "./utils/file";
import { loadFromJw } from "./utils/loadFromJw";

let courses: Course[] = [];

const stored = localStorage.getItem("ustc.gpa.courses");
if (stored) {
  const parsed = JSON.parse(stored);
  if (parsed.version === version) {
    courses = parsed.courses.map(
      (c: any) => new Course(c.name, c.id, c.hour, c.credits, c.score),
    );
  }
}

setInterval(() => {
  localStorage.setItem(
    "ustc.gpa.courses",
    JSON.stringify({
      version,
      courses,
    }),
  );
}, 500);

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
            _.$cls`text-[15px] py-[9px]`
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
              byIndex,
              (course, index) => {
                const active = index === selected;

                _.$cls`course-name hover:underline hover:text-blue-600`;
                active && _.$cls`active-td font-bold`;
                _._td(
                  {
                    onclick: ev => {
                      ev.stopPropagation();
                      app.update();

                      if (active) {
                        selected = -1;
                        resetTempCourse();
                        return;
                      }

                      selected = index;
                      selectedRestore = course.clone();
                      tempCourse = course;
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
                    },
                  },
                  _ => {
                    _.t(course.name);
                    _._small({}, course.id);
                  },
                );
                _.td(course.hour);
                _.td(course.credits);
                _.td(course.gpaStr);
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

const tabsRef = componentRef<"fTabs">();

let selected: number = -1;
let selectedRestore: Course | null = null;

let tempCourse = new Course();
const tempPoint = model(100);
const tempLevel = model<Level>("A+");
const tempPass = model(true);

function resetTempCourse() {
  tempCourse = new Course();
  tempPoint.value = 100;
  tempLevel.value = "A+";
  tempPass.value = true;
}

const TextInput = $view(
  (name: string, key: keyof Course, placeholder: string) => {
    _.$cls`my-4`;
    _.div(_ => {
      _.$cls`block mb-0 mr-2 font-semibold text-xl`;
      _.label(name);
      _.fInput(propModel(tempCourse, key) as Model<string>, false, placeholder);
    });
  },
);

const NumberInput = $view((name: string, key: keyof Course) => {
  _.$cls`my-4`;
  _.div(_ => {
    _.$cls`block mb-0 mr-2 font-semibold text-xl`;
    _.label(name);
    _.fNumberInput(propModel(tempCourse, key) as Model<number>);
  });
});

const EditorFragment = (_: Context) => {
  _.$cls`flex gap-x-6 flex-wrap`;
  _.div(_ => {
    _.div(_ => {
      _(TextInput)("名称", "name", "e.g. 数学分析(B1)");
      _(TextInput)("编号", "id", "e.g. MATH1006");
    });
    _.div(_ => {
      _(NumberInput)("学时", "hour");
      _(NumberInput)("学分", "credits");
    });
    _.$ref(tabsRef);
    _.$css`padding:0;max-height:130px;min-height:110px;margin-left:-4px;width:270px`;
    if (
      _.fTabs(
        "百分制",
        _ => {
          _.fNumberInput(tempPoint) && (tempCourse.score = _.$ev);
        },
        "五等级制",
        _ => {
          _.fDropdown(tempLevel, Object.keys(levelMap).slice(0, -1)) &&
            (tempCourse.score = _.$ev as Level);
        },
        "二等级制",
        _ => {
          _.fCheckbox("通过", tempPass) &&
            (tempCourse.score = tempPass.value ? passSym : failSym);
        },
      )
    ) {
      if (_.$ev === "百分制") {
        tempCourse.score = tempPoint.value;
      }
      if (_.$ev === "五等级制") {
        tempCourse.score = tempLevel.value;
      }
      if (_.$ev === "二等级制") {
        tempCourse.score = tempPass.value ? passSym : failSym;
      }
    }
  });

  const allFilled =
    tempCourse.name.length &&
    tempCourse.id.length &&
    tempCourse.hour &&
    tempCourse.credits;

  _.div(_ => {
    if (selected !== -1) {
      if (
        _.fButton(_ => {
          _.$cls`mr-4`;
          _(FiCheckmark16Filled)();
          _.span("保存更改");
        }, !allFilled)
      ) {
        resetTempCourse();
        selected = -1;
      }

      _.$cls`ml-4`;
      _.span();

      if (
        _.fButton(_ => {
          _.$cls`mr-4`;
          _(FiDismiss16Filled)();
          _.span("放弃更改");
        })
      ) {
        courses[selected] = selectedRestore!;
        resetTempCourse();
        selected = -1;
      }

      _.$cls`ml-4`;
      _.span();

      if (
        _.fButton(_ => {
          _.$cls`mr-4`;
          _(FiDelete16Regular)();
          _.span("删除");
        })
      ) {
        courses.splice(selected, 1);
        selectedRestore = null;
        resetTempCourse();
        selected = -1;
      }
    } else {
      if (
        _.fPrimaryButton(_ => {
          _.$cls`mr-4`;
          _(FiAdd16Filled)();
          _.span("添加");
        }, !allFilled)
      ) {
        courses.push(tempCourse);
        resetTempCourse();
      }
    }
  });
};

const jwRawInput = model("");

const ImportExportFragment = (_: Context) => {
  _.$cls`grid gap-4`;
  _.div(_ => {
    _.$css`max-width: 100vw-24px`;
    _.fDialog(
      open =>
        _.fButton(_ => {
          _.$cls`mr-4`;
          _(FiArrowImport20Filled)();
          _.t`从教务系统导入`;
        }) && open(),
      _ => {
        _.t`从教务系统导入`;
        _.$cls`inline ml-4 mr-1`;
        _(FiInfoRegular)();
        _.$cls`text-2xl font-normal hover:text-blue-500 hover:underline`;
        _.$attrs({ target: "_blank" });
        _.a(
          "操作视频",
          "https://xhfs4.ztytech.com/CA107011/b478b4b8c5874d568b8eb93644d7fc5b.gif",
        );
      },
      _close => {
        _.$cls`flex flex-col gap-4`;
        _.div(_ => {
          _.$cls`w-full h-[250px]`;
          _.fTextarea(jwRawInput);

          _.div(_ => {
            _.$cls`ml-2 font-bold text-xl`;
            _.div(_ => {
              _.span("预览");
              _.$cls`inline text-xl ml-6 mr-1`;
              _(FiInfo12Regular)();
              _.$cls`font-normal text-lg font-sans`;
              _.span("如有错误，可以添加后再编辑哦");
            });
            _.$cls`table`;
            _.table(
              loadFromJw(jwRawInput.value),
              ["名称", "编号", "学时", "学分", "绩点", "成绩"],
              byIndex,
              course => {
                _.td(course.name);
                _.td(course.id);
                _.td(course.hour);
                _.td(course.credits);
                _.td(course.gpaStr);
                _.td(course.scoreStr);
              },
            );
          });
        });
      },
      close => {
        _.fButton("取消") && close();
        _.fDialog(
          open => _.fPrimaryButton("确定") && open(),
          "确定？",
          "导入后将会覆盖当前编辑器中的内容，确定要继续吗？",
          closeInner => {
            _.fButton("取消") && closeInner();
            if (_.fPrimaryButton("确定")) {
              courses = loadFromJw(jwRawInput.value);
              selected = -1;
              resetTempCourse();
              close();
              closeInner();
            }
          },
        );
      },
      "end",
      true,
    );
    if (
      _.fButton(_ => {
        _.$cls`mr-4`;
        _(FiFolderOpen20Regular)();
        _.t`从本地导入`;
      })
    ) {
      loadFromFile().then(c => {
        courses = c;
        selected = -1;
        resetTempCourse();
        app.update();
      });
    }
    if (
      _.fButton(_ => {
        _.$cls`mr-4`;
        _(FiSave20Regular)();
        _.t`保存至本地`;
      })
    ) {
      saveToFile(courses);
    }
    if (
      _.fButton(_ => {
        _.$cls`mr-4`;
        _(FiDelete20Regular)();
        _.t`清空`;
      })
    ) {
      courses = [];
      selected = -1;
    }
  });
};

const app = $app([Basics, FluentUI(webDarkTheme, webLightTheme)], _ => {
  _.$cls`flex flex-col min-h-screen px-12 pb-12`;
  _.div(_ => {
    _.$cls`flex items-start`;
    _.div(_ => {
      _.$cls`inline flex-grow font-extrabold text-6xl font-mono mt-6 mb-1`;
      _.h1("USTC GPA Calculator");

      _.$cls`inline text-right font-mono h-0 overflow-visible mt-4`;
      _.div(_ => {
        _.p(_ => {
          _.t`By `;
          _.$attrs({ target: "_blank" });
          _.a("_Kerman", "https://github.com/kermanx");
        });
        _.p(_ => {
          _.$attrs({ target: "_blank" });
          _.a("Repository", "https://github.com/USTCdev/gpa-calculator");
          _.$cls`ml-3`;
          _.span("|");
          _.$cls`ml-3`;
          _.$attrs({ target: "_blank" });
          _.a("Bug!", "https://github.com/USTCdev/gpa-calculator/issues/new");
        });
        _.p(_ => {
          _.t`Powered by `;
          _.$attrs({ target: "_blank" });
          _.a("Refina.js", "https://github.com/refinajs/refina");
        });
      });
    });

    const containerStyle =
      "border-2 border-solid border-gray-300 rounded-lg shadow-md";

    _.$cls`relative flex gap-4 flex-wrap`;
    _.div(_ => {
      _.$cls`flex-grow`;
      _.div(_ => {
        _.$cls`text-4xl font-bold font-mono ml-1 mt-2`;
        _.h2("Editor");
        _.$cls`pb-4 px-4 ${containerStyle} min-h-[180px]`;
        _.div(EditorFragment);
      });
      _.$cls`flex-grow flex flex-col`;
      _.div(_ => {
        _.$cls`text-4xl font-bold font-mono ml-1 mt-2`;
        _.h2("Import & Export");
        _.$cls`flex-grow p-4 ${containerStyle}`;
        _.div(ImportExportFragment);
      });
    });

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
    _.$cls`p-14 flex-1 ${containerStyle}`;
    _._div(
      {
        onclick: () => {
          console.log(app);
          app.update();
          selected = -1;
          resetTempCourse();
        },
      },
      OutputFragment,
    );
  });
});

declare module "refina" {
  interface Plugins {
    Basics: typeof Basics;
    FluentUI: typeof FluentUI;
  }
}

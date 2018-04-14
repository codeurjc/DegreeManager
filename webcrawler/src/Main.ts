import { Exam } from "./Exam";
import * as webdriverio from "webdriverio";
import { setTimeout } from "timers";
import * as fs from "fs-extra";

type Browser = webdriverio.Client<webdriverio.RawResult<null>> &
  webdriverio.RawResult<null>;

let exams: Exam[] = [];

let examsPerSubject: Map<String, Exam[]> = new Map();

async function sleep(millis: number) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, millis);
  });
}

function addExam(exam: Exam) {
  //console.log("     " + exam.subject);
  exams.push(exam);

  let sExams = examsPerSubject.get(exam.subject);
  if (!sExams) {
    sExams = [];
    examsPerSubject.set(exam.subject, sExams);
  }
  sExams.push(exam);
}

async function extract() {
  var options = {
    desiredCapabilities: {
      //browserName: "firefox"
      browserName: "chrome"
    }
  };

  let browser = webdriverio.remote(options).init();

  await browser.url("https://gestion2.urjc.es/examenes/");

  console.log("University page loaded");

  browser
    .element("#facultad")
    .selectByVisibleText("Esc. Superior de Ingeniería Informática");

  console.log("School selected");

  await sleep(2000);

  await extractCampusInformation(browser, "MÓSTOLES");
  await extractCampusInformation(browser, "MADRID - VICÁLVARO");

  browser.end();
}

async function extractCampusInformation(
  browser: Browser,
  campusName: string
): Promise<void> {

  browser.element("#campus").selectByVisibleText(campusName);

  console.log("Campus selected");

  await sleep(2000);

  let degrees = (await browser.element("#titulacion").elements("option")).value;

  let degreeNames: string[] = [];

  if (degrees) {
    for (let degree of degrees) {
      let degreeName = (await browser.elementIdText(degree.ELEMENT)).value;
      console.log(degreeName);
      if (degreeName !== "(Seleccionar)") {
        degreeNames.push(degreeName);
      }
    }

    console.log("Degress: " + degreeNames);
  }

  if (degreeNames.length == 0) {
    console.log("No degrees. Exiting");
  }

  for (let degreeName of degreeNames) {
    await browser.element("#titulacion").selectByVisibleText(degreeName);
    await sleep(2000);
    console.log("Degree selected: " + degreeName);

    await browser.element("#convocatoria").selectByVisibleText("Todas");
    await sleep(8000);

    console.log(degreeName);

    let courses = (await browser.element("#listadoexamenes").elements("table"))
      .value;

    for (let course of courses) {
      
      let courseElement = (await browser.elementIdElement(
        course.ELEMENT,
        "caption"
      )).value;

      let courseName = (await browser.elementIdText(courseElement.ELEMENT)).value.substring(6);

      console.log("Course "+courseName);
      
      let subjects = (await browser.elementIdElements(course.ELEMENT, "tr"))
        .value;

        for (let subject of subjects) {

        

        let subjectDataElements = (await browser.elementIdElements(
          subject.ELEMENT,
          "td"
        )).value;

        let subjectData: string[] = [];

        for (let data of subjectDataElements) {
          subjectData.push((await browser.elementIdText(data.ELEMENT)).value);
        }
        if (subjectData[0] && !subjectData[0].includes("Asignatura")) {
          console.log("     " + subjectData[0]);

          addExam({
            degree: degreeName,
            course: courseName,
            subject: subjectData[0],
            group: subjectData[1],
            date: subjectData[2],
            hour: subjectData[3],
            convocation: subjectData[4],
            classrooms: subjectData[5]
          });
        }
      }
    }
    console.log("---------------------------------------------------");
  }
}

function groupBySubject(filter: (exam: Exam) => boolean) {
  examsPerSubject.forEach((exams, subject) => {
    console.log("Subject: " + subject);
    if (filter) {
      exams = exams.filter(filter);
    }
    exams.forEach(exam => {
      console.log(
        "    " +
          exam.degree +
          " " +
          exam.convocation +
          " " +
          exam.date +
          " " +
          exam.hour
      );
    });
    console.log();
  });
}

function groupByDate(filter: (exam: Exam) => boolean) {
  let examsPerDate: Map<String, Exam[]> = new Map();

  examsPerSubject.forEach((exams, subject) => {
    if (filter) {
      exams = exams.filter(filter);
    }
    exams.forEach(exam => {
      let fullDate = exam.date + " " + exam.hour;

      let dateExams = examsPerDate.get(fullDate);
      if (!dateExams) {
        dateExams = [];
        examsPerDate.set(fullDate, dateExams);
      }
      dateExams.push(exam);
    });
  });

  let fullDates = Array.from(examsPerDate.keys());
  fullDates.sort();

  for(let fullDate of fullDates){
    let exams = examsPerDate.get(fullDate);
    if(!exams){ continue; }
    console.log("Date: " + fullDate);
    exams.forEach(exam => {
      console.log(
        "    " +
          exam.course +
          " " +
          exam.subject +
          " " +
          exam.degree +
          " " +
          exam.convocation
      );
    });
    console.log();
  };
}

function saveExamsFile() {
  fs.writeFile("exams.json", JSON.stringify(exams), function(err) {
    if (err) return console.log(err);
  });
}

async function loadExamsFile() {
  let fileExams = await fs.readJson("exams.json");
  for (let exam of fileExams) {
    addExam(exam);
  }
}

(async () => {
  try {
    // await extract();
    // saveExamsFile();
    await loadExamsFile();
    //groupBySubject(exam => exam.convocation === "Mayo");
    groupByDate(
      exam =>
        exam.convocation ===
        "Mayo" /* && exam.subject === "SISTEMAS DISTRIBUIDOS"*/
    );
  } catch (e) {
    console.error(e);
  }
})();

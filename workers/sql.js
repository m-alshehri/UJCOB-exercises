importScripts("/vendor/sql.js/sql-wasm.js");
let sqlPromise = null;
function getSql() {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({
      locateFile: (f) => "/vendor/sql.js/" + f,
    });
  }
  return sqlPromise;
}
onmessage = async ({ data }) => {
  let student, answer;
  try {
    const S = await getSql();
    student = new S.Database();
    answer = new S.Database();
    student.run(data.schema);
    answer.run(data.schema);
    const rows = (r) => (r.length ? r[r.length - 1].values : []);
    let got, expected;
    if (data.verificationQuery) {
      student.run(data.code);
      got = student.exec(data.verificationQuery);
      expected = data.expectedRows || [];
    } else if (data.expected === "VERIFY_INSERT") {
      student.run(data.code);
      got = student.exec(
        "SELECT CustomerID,Name,City FROM Customers WHERE CustomerID=6",
      );
      expected = [[6, "Nora", "Jeddah"]];
    } else if (data.expected === "VERIFY_UPDATE") {
      student.run(data.code);
      got = student.exec("SELECT Price FROM Products WHERE ProductID=2");
      expected = [[150]];
    } else if (data.expected === "VERIFY_DELETE") {
      student.run(data.code);
      got = student.exec("SELECT CustomerID FROM Customers WHERE CustomerID=5");
      expected = [];
    } else {
      got = student.exec(data.code);
      expected = rows(answer.exec(data.expected));
    }
    postMessage({
      ok: JSON.stringify(rows(got)) === JSON.stringify(expected),
      result: got,
    });
  } catch (e) {
    postMessage({ error: String(e) });
  } finally {
    student?.close();
    answer?.close();
  }
};

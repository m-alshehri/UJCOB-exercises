importScripts(
  "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js",
);
onmessage = async ({ data }) => {
  let student, answer;
  try {
    const S = await initSqlJs({
      locateFile: (f) =>
        "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/" + f,
    });
    student = new S.Database();
    answer = new S.Database();
    student.run(data.schema);
    answer.run(data.schema);
    const rows = (r) => (r.length ? r[r.length - 1].values : []);
    let got, expected;
    if (data.expected === "VERIFY_INSERT") {
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

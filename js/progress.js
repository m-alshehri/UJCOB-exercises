window.LabProgress = class {
  constructor(course, lab, exercises) {
    this.course = course;
    this.lab = lab;
    this.exercises = exercises;
    this.solved = new Set();
    this.ready = this.init();
    this.pending = new Map();
  }
  async init() {
    try {
      const s = await Tamareen.session(true);
      this.user = s.user;
      this.courseId = (
        await Tamareen.checked(
          Tamareen.client()
            .from("courses")
            .select("id")
            .eq("code", this.course)
            .single(),
        )
      ).id;
      const rows = await Tamareen.all(() =>
        Tamareen.client()
          .from("lab_progress")
          .select("exercise_key")
          .eq("user_id", this.user.id)
          .eq("course_id", this.courseId)
          .eq("lab_type", this.lab)
          .eq("completed", true)
          .order("id"),
      );
      rows.forEach((row) => {
        const index = this.exercises.findIndex(
          (x) =>
            x.id === row.exercise_key ||
            String(x.legacyIndex) === row.exercise_key,
        );
        if (index >= 0) this.solved.add(index);
      });
      return true;
    } catch (e) {
      Tamareen.status("Progress could not load. " + e.message, "error");
      return false;
    }
  }
  async save(index) {
    if (this.pending.has(index)) return this.pending.get(index);
    const action = this.persist(index).finally(() =>
      this.pending.delete(index),
    );
    this.pending.set(index, action);
    return action;
  }
  async persist(index) {
    try {
      if (!(await this.ready)) {
        this.ready = this.init();
        if (!(await this.ready)) throw new Error("Reconnect and try again.");
      }
      const exercise = this.exercises[index];
      Tamareen.status("Saving completion…");
      await Tamareen.checked(
        Tamareen.client().from("lab_progress").upsert(
          {
            user_id: this.user.id,
            course_id: this.courseId,
            lab_type: this.lab,
            exercise_key: exercise.id,
            exercise_title: exercise.title,
            completed: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,course_id,lab_type,exercise_key" },
        ),
      );
      this.solved.add(index);
      Tamareen.status("Completion saved.", "success");
      return true;
    } catch (e) {
      Tamareen.report?.("progress_save");
      Tamareen.status(
        "Your check passed, but completion was not saved. " + e.message,
        "error",
        () => this.save(index),
      );
      return false;
    }
  }
};

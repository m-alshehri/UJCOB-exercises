window.LabProgress = class {
  constructor(course, lab, exercises) {
    this.course = course;
    this.lab = lab;
    this.exercises = exercises;
    this.solved = new Set();
    this.ready = this.init();
    this.pending = new Map();
    this.ready.then((ok) => {
      if (ok) this.flush().catch(() => {});
    });
    window.addEventListener("online", () => this.flush().catch(() => {}));
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
  key() {
    return "tamareen:pending-progress:" + this.user?.id + ":" + this.lab;
  }
  queued() {
    try {
      return JSON.parse(localStorage.getItem(this.key()) || "[]");
    } catch {
      return [];
    }
  }
  remember(index, remove = false) {
    if (!this.user) return false;
    try {
      const keys = new Set(this.queued());
      const id = this.exercises[index].id;
      remove ? keys.delete(id) : keys.add(id);
      localStorage.setItem(this.key(), JSON.stringify([...keys]));
      return true;
    } catch {
      return false;
    }
  }
  async flush() {
    if (!this.user) return;
    const session = await Tamareen.session();
    if (session?.user.id !== this.user.id) return;
    for (const key of this.queued()) {
      const index = this.exercises.findIndex((e) => e.id === key);
      if (index >= 0) await this.save(index);
    }
  }
  async persist(index) {
    let buffered = false;
    try {
      buffered = this.remember(index);
      if (!(await this.ready)) {
        this.ready = this.init();
        if (!(await this.ready)) throw new Error("Reconnect and try again.");
      }
      buffered = this.remember(index);
      const session = await Tamareen.session();
      if (session?.user.id !== this.user.id)
        throw new Error("Sign in with the same account to save this result.");
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
      this.remember(index, true);
      this.solved.add(index);
      window.updateSolved?.();
      Tamareen.status("Completion saved.", "success");
      return true;
    } catch (e) {
      Tamareen.report?.("progress_save");
      Tamareen.status(
        (buffered
          ? "Completion queued on this device. Reconnect to sync. "
          : "Your check passed, but completion was not saved. ") + e.message,
        "error",
        () => this.save(index),
      );
      return false;
    }
  }
};

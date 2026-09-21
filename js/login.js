let current = "login";
const next = Tamareen.internalPath(
  new URLSearchParams(location.search).get("next"),
);
const field = (id) => document.getElementById(id);
function mode(value) {
  current = value;
  field("loginTab").classList.toggle("active", value === "login");
  field("signupTab").classList.toggle("active", value === "signup");
  field("title").textContent = {
    login: "Login to tamareen",
    signup: "Create your tamareen account",
    forgot: "Reset your password",
    recovery: "Choose a new password",
  }[value];
  field("sub").textContent =
    value === "forgot"
      ? "Enter your email to receive a password reset link."
      : "Save your personal practice and follow your learning progress.";
  field("submit").textContent = {
    login: "Login",
    signup: "Create account",
    forgot: "Send reset link",
    recovery: "Save new password",
  }[value];
  field("nameField").style.display = value === "signup" ? "block" : "none";
  field("confirmField").style.display = ["signup", "recovery"].includes(value)
    ? "block"
    : "none";
  field("password").parentElement.style.display =
    value === "forgot" ? "none" : "block";
  field("email").parentElement.style.display =
    value === "recovery" ? "none" : "block";
  field("password").autocomplete =
    value === "login" ? "current-password" : "new-password";
  field("msg").textContent = "";
}
async function submitAuth() {
  const button = field("submit");
  if (button.disabled) return;
  const email = field("email").value.trim(),
    password = field("password").value,
    name = field("studentName").value.trim();
  const message = field("msg");
  message.className = "msg";
  try {
    if (current !== "recovery" && (!email || !field("email").checkValidity()))
      throw new Error("Enter a valid email address.");
    if (current !== "forgot" && !password)
      throw new Error("Enter your password.");
    if (["signup", "recovery"].includes(current)) {
      if (password.length < 8)
        throw new Error("Use a password with at least 8 characters.");
      if (password !== field("confirmPassword").value)
        throw new Error("Passwords do not match.");
    }
    if (current === "signup" && !name) throw new Error("Enter your name.");
    button.disabled = true;
    const c = Tamareen.client();
    if (current === "forgot") {
      await Tamareen.checked(
        c.auth.resetPasswordForEmail(email, {
          redirectTo: location.origin + "/login.html?recovery=1",
        }),
      );
      message.textContent =
        "If this email has an account, a reset link will arrive shortly.";
    } else if (current === "recovery") {
      await Tamareen.checked(c.auth.updateUser({ password }));
      location.href = "/dashboard.html";
    } else if (current === "signup") {
      const data = await Tamareen.checked(
        c.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              location.origin + "/login.html?next=" + encodeURIComponent(next),
            data: { student_name: name, full_name: name },
          },
        }),
      );
      if (data.session) location.href = next;
      else {
        mode("login");
        message.textContent =
          "Account created. Check your email to confirm your account, then log in.";
      }
    } else {
      await Tamareen.checked(c.auth.signInWithPassword({ email, password }));
      location.href = next;
    }
    message.className = "msg ok";
  } catch (e) {
    message.textContent =
      e.message || "Authentication failed. Please try again.";
    message.className = "msg err";
  } finally {
    button.disabled = false;
  }
}
const forgot = document.createElement("button");
forgot.type = "button";
forgot.textContent = "Forgot password?";
forgot.className = "btn";
forgot.onclick = () => mode("forgot");
field("submit").after(forgot);
field("msg").setAttribute("role", "status");
document.querySelectorAll("input").forEach((input) =>
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitAuth();
    }
  }),
);
Tamareen.client().auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY") mode("recovery");
});
if (new URLSearchParams(location.search).get("recovery") === "1")
  mode("recovery");

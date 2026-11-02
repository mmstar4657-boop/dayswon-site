(function(){
  var API = "https://dayswon.sites.tab.bot/api/lead", MAIL = "hello@dayswon.com";
  var f = document.getElementById("lead-form");
  if(!f) return;
  var err = document.getElementById("f-err"), btn = f.querySelector(".f-submit"), btnHTML = btn.innerHTML;
  var done = document.getElementById("f-done"), doneText = document.getElementById("f-done-text");
  var sec = document.getElementById("form");

  /* smooth scroll for in-page "Book a call" links */
  document.querySelectorAll('a[href="#form"], a[href="contact.html#form"]').forEach(function(a){
    a.addEventListener("click", function(e){
      e.preventDefault();
      sec.scrollIntoView({behavior: "smooth", block: "start"});
      if(history.replaceState) history.replaceState(null, "", "#form");
    });
  });

  function val(n){ var x = f.elements[n]; return x ? String(x.value || "").trim() : ""; }
  function mailto(d){
    var s = "Project inquiry from " + d.name;
    var b = "Name: " + d.name + "\nEmail: " + (d.email || "") + "\nCompany: " + (d.company || "") + "\nService: " + (d.service || "") + "\n\n" + d.message;
    return "mailto:" + MAIL + "?subject=" + encodeURIComponent(s) + "&body=" + encodeURIComponent(b);
  }
  function showErr(html, field){
    err.innerHTML = html; err.hidden = false;
    if(field){ var w = f.elements[field].closest(".field"); if(w) w.classList.add("bad"); f.elements[field].focus(); }
  }
  f.addEventListener("input", function(e){ var w = e.target.closest && e.target.closest(".field"); if(w) w.classList.remove("bad"); });

  f.addEventListener("submit", function(e){
    e.preventDefault();
    err.hidden = true; err.innerHTML = "";
    f.querySelectorAll(".field.bad").forEach(function(w){ w.classList.remove("bad"); });
    var d = { type: "inquiry", name: val("name"), email: val("email"), company: val("company"), service: val("service"), message: val("message"), website: val("website"), page: location.href };
    if(!d.name) return showErr("Please add your name.", "name");
    if(!d.email) return showErr("Please add your email.", "email");
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return showErr("That email doesn't look right.", "email");
    if(d.message.length < 10) return showErr("Please tell us a little about your project.", "message");
    btn.disabled = true; btn.textContent = "Sending…";
    var ok = function(){
      var first = d.name.split(" ")[0];
      doneText.textContent = "Thank you, " + first + ". Your inquiry is in, and we'll reply to " + d.email + " with next steps.";
      f.hidden = true; done.hidden = false;
      sec.scrollIntoView({behavior: "smooth", block: "start"});
    };
    var fail = function(){
      btn.disabled = false; btn.innerHTML = btnHTML;
      showErr('Something went wrong sending this. Please try again, or <a href="' + mailto(d) + '">send it by email</a> to ' + MAIL + '.');
    };
    if(!window.fetch) return fail();
    fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(d) })
      .then(function(r){ return r.json().then(function(j){ return !!(r.ok && j.ok); }); })
      .then(function(good){ good ? ok() : fail(); })
      .catch(fail);
  });
})();

const $ = (sel) => document.querySelector(sel);

function fmtMonth(ym) {
  // ym: "YYYY-MM"
  if (!ym) return "";
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, (m || 1) - 1, 1));
  return d.toLocaleString(undefined, { month: "short", year: "numeric", timeZone: "UTC" });
}

function joinDateRange(start, end) {
  const s = fmtMonth(start);
  const e = end ? fmtMonth(end) : "Present";
  return [s, e].filter(Boolean).join(" – ");
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  for (const child of children) {
    node.append(child);
  }
  return node;
}

function renderLinks(container, links = []) {
  container.replaceChildren(
    ...links.map((l) =>
      el("a", { href: l.url, class: "badge", target: "_blank", rel: "noreferrer" }, [document.createTextNode(l.label)])
    )
  );
}

function renderSkillTags(container, skills = []) {
  const tags = skills.flatMap((s) => s.items.map((it) => `${s.name}: ${it}`));
  container.replaceChildren(
    ...tags.map((t) => el("span", { class: "badge" }, [document.createTextNode(t)]))
  );
}

function renderExperience(container, items = []) {
  container.replaceChildren(
    ...items.map((job) => {
      const header = el("div", { class: "stack gap-2" }, [
        el("div", { class: "stack gap-2" }, [
          el("h3", {}, [document.createTextNode(`${job.title} — ${job.company}`)]),
          el("div", { class: "meta" }, [
            document.createTextNode(`${joinDateRange(job.start, job.end)} · ${job.location ?? ""}`.replace(/\s·\s$/, ""))
          ])
        ])
      ]);

      const ul = el("ul", { class: "list" }, (job.highlights || []).map((h) => el("li", {}, [document.createTextNode(h)])));
      const tech = (job.tech || []).length
        ? el("div", { class: "row wrap gap-2" }, job.tech.map((t) => el("span", { class: "badge" }, [document.createTextNode(t)])))
        : el("div");

      return el("article", { class: "card stack gap-3" }, [header, ul, tech]);
    })
  );
}

function renderProjects(container, items = []) {
  container.replaceChildren(
    ...items.map((p) => {
      const links = el("div", { class: "row wrap gap-2" }, (p.links || []).map((l) =>
        el("a", { href: l.url, class: "badge", target: "_blank", rel: "noreferrer" }, [document.createTextNode(l.label)])
      ));

      const tech = el("div", { class: "row wrap gap-2" }, (p.tech || []).map((t) =>
        el("span", { class: "badge" }, [document.createTextNode(t)])
      ));

      return el("article", { class: "card stack gap-2" }, [
        el("h3", {}, [document.createTextNode(p.name)]),
        el("p", { class: "muted" }, [document.createTextNode(p.description || "")]),
        links,
        tech
      ]);
    })
  );
}

function renderPublications(container, items = []) {
  container.replaceChildren(
    ...items.map((pub) => {
      const title = pub.url
        ? el("a", { href: pub.url, target: "_blank", rel: "noreferrer" }, [document.createTextNode(pub.title)])
        : document.createTextNode(pub.title);

      return el("div", { class: "card stack gap-2" }, [
        el("div", {}, [title]),
        el("div", { class: "meta" }, [document.createTextNode(`${pub.authors} · ${pub.venue} · ${pub.year}`)])
      ]);
    })
  );
}

function renderEducation(container, items = []) {
  container.replaceChildren(
    ...items.map((e) => {
      const details = el("ul", { class: "list" }, (e.details || []).map((d) => el("li", {}, [document.createTextNode(d)])));
      return el("article", { class: "card stack gap-2" }, [
        el("h3", {}, [document.createTextNode(`${e.degree} — ${e.institution}`)]),
        el("div", { class: "meta" }, [document.createTextNode(`${e.start} – ${e.end} · ${e.location || ""}`.replace(/\s·\s$/, ""))]),
        details
      ]);
    })
  );
}

async function main() {
  const res = await fetch("data.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load data.json: ${res.status}`);
  const data = await res.json();

  // Basics
  document.title = data.basics?.name ? `${data.basics.name}` : "Resume";
  $("#name").textContent = data.basics?.name ?? "";
  $("#label").textContent = data.basics?.label ?? "";
  $("#location").textContent = data.basics?.location ?? "";
  $("#summary").textContent = data.basics?.summary ?? "";

  // Links + skills tags
  renderLinks($("#links"), data.basics?.links ?? []);
  renderSkillTags($("#skillTags"), data.skills ?? []);

  // Sections
  renderExperience($("#experience"), data.experience ?? []);
  renderProjects($("#projects"), data.projects ?? []);
  renderPublications($("#publications"), data.publications ?? []);
  renderEducation($("#education"), data.education ?? []);

  // Contact
  const email = data.basics?.email ?? "";
  const emailEl = $("#email");
  emailEl.textContent = email;
  emailEl.href = email ? `mailto:${email}` : "#";

  // Footer
  $("#year").textContent = new Date().getFullYear();
  $("#footerName").textContent = data.basics?.name ?? "";
}

main().catch((err) => {
  console.error(err);
  document.body.prepend(
    el("div", { class: "container" }, [
      el("p", { class: "card" }, [document.createTextNode("Could not load site data. Check console for details.")])
    ])
  );
});

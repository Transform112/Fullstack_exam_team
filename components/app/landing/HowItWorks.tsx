export function HowItWorks() {
  return <section id="how-it-works" className="studio-how">
    <div className="container-page how-grid">
      <div>
        <p className="eyebrow">FROM YOUR HEART TO THEIR SCREEN</p>
        <h2>A little thought.<br />A lovely surprise.</h2>
      </div>
      <ol>{[
        ["01", "Choose their mood", "Find a design that feels like them. Soft and sweet, bold and bright, or quietly elegant."],
        ["02", "Make it personal", "Add your favourite photos, a few heartfelt words, and the moments worth keeping."],
        ["03", "Send a little joy", "Preview your page, publish when you’re ready, and share their very own surprise link."]
      ].map(([n, title, text]) => <li key={n}>
        <span className="step-number">{n}
        </span>
        <h3>{title}
        </h3>
        <p>{text}
        </p>
      </li>)}
      </ol>
    </div>
  </section>;
}
export default HowItWorks;

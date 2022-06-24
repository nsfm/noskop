import * as Blessed from "blessed";
import * as Cursed from "blessed-contrib";

export class Interface {
  public readonly screen: Blessed.Widgets.Screen;

  public readonly boost: Cursed.widget.Gauge;
  public readonly log: Cursed.widget.Log;

  constructor() {
    this.screen = Blessed.screen({ smartCSR: true });

    this.boost = Cursed.gauge({
      label: "Boost",
      stroke: "blue",
      fill: "white",
      percent: [0],
    });
    this.screen.append(this.boost);

    this.log = Cursed.log({
      label: "Log",
      stroke: "blue",
      border: { type: "line" },
    });
    this.screen.append(this.log);

    setInterval(() => {
      this.screen.render();
    }, 1000 / 30);
  }

  setBoost(amount: number): void {
    this.boost.setPercent(amount * 100);
  }
}

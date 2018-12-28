import React from 'react';
import { connect } from 'react-redux';

import { pipelineUtils as p } from '../../utils/pipeline-utils';

export class HomeHeaderPipeline extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      config: {
        pipeCount: 15,
        maxDelay: 200,
        minLength: 300,
        maxLength: 1000,
        minRadius: 2,
        maxRadius: 6,
        minSpeed: 0.75,
        maxSpeed: 0.3,
        minLifetime: 0,
        maxLifeTime: 20,
        minX: 0,
        maxX: 0,
        minY: 0,
        maxY: 0,
        minTurns: 2,
        maxTurns: 8,
        minOpacity: 0.25,
        maxOpacity: 0.5,
      },
      pipes: [],
    };

    this.canvas = React.createRef();
  }

  componentDidMount() {
    this.setup()
      .then(() => {
        this.generatePipes();
      })
      .then(() => {
        const ctx = this.canvas.current.getContext('2d');
        this.draw(0, ctx);
      })
      .catch(() => {});
  }

  setup() {
    return new Promise(resolve => {
      const headerLeft = document.querySelector('.home-header__name').getBoundingClientRect().left - 128;
      const rect = document.querySelector('.home-header').getBoundingClientRect();
      this.canvas.current.width = rect.width;
      this.canvas.current.height = rect.height;
      this.setState(
        prevState => ({
          config: {
            ...prevState.config,
            maxX: headerLeft,
            minY: 0 + this.canvas.current.height / 4,
            maxY: this.canvas.current.height - this.canvas.current.height / 4,
          },
        }),
        resolve
      );
    });
  }

  generatePipes() {
    return new Promise(resolve => {
      const pipes = [];

      for (let i = 0; i < this.state.config.pipeCount; i++) {
        pipes.push(this.generatePipe(i, 0));
      }

      this.setState({ pipes }, resolve);
    });
  }

  generatePipe(i, tick) {
    const config = this.state.config;
    const turns = [];
    const turnCount = p.randIn(config.minTurns, config.maxTurns);
    const fullLength = p.floor(p.randIn(config.minLength, config.maxLength));
    const angle = p.PI / 4;
    const allowedStartingDirections = [1, 2, 3, 5, 6, 7];

    for (let turn = 0; turn < turnCount; turn++) {
      turns.push([p.floor(p.randIn(0, fullLength)), p.round(p.rand(1)) ? -1 : 1]);
    }

    const pipe = {
      pipeId: i,
      fullLength,
      startingTick: p.floor(p.randIn(tick, tick + config.maxDelay)),
      pipeRadius: p.round(p.randIn(config.minRadius, config.maxRadius)),
      speed: p.randIn(config.minSpeed, config.maxSpeed),
      lifetime: p.randIn(config.minLifetime, config.maxLifeTime),
      startPos: [p.floor(p.randIn(config.minX, config.maxX)), p.floor(p.randIn(config.minY, config.maxY))],
      startDirection: allowedStartingDirections[p.round(p.randIn(0, allowedStartingDirections.length))] * angle,
      baseOpacity: p.randIn(config.minOpacity, config.maxOpacity),
      turns,
    };

    return pipe;
  }

  draw(tick, ctx) {
    this.clearCanvas(ctx);
    this.renderPipes(tick, ctx);

    window.requestAnimationFrame(() => {
      this.draw(tick + 1, ctx);
    });
  }

  clearCanvas(ctx) {
    ctx.save();
    ctx.fillStyle = '#1e282e';
    ctx.fillRect(
      0,
      0,
      this.canvas.current.getBoundingClientRect().width,
      this.canvas.current.getBoundingClientRect().height
    );
    ctx.restore();
  }

  renderPipes(tick, ctx) {
    const pipeCount = this.state.config.pipeCount;
    const pipes = this.state.pipes;

    for (let i = 0; i < pipeCount; i++) {
      this.renderPipe(pipes[i], tick, ctx);
    }
  }

  renderPipe(pipe, tick, ctx) {
    if (tick < pipe.startingTick) return;

    const fullyDrawn = pipe.startingTick + pipe.fullLength * pipe.speed;
    const startFade = fullyDrawn + pipe.lifetime;
    const finalTick = startFade + pipe.fullLength * pipe.speed;

    if (tick >= finalTick) {
      this.setState(prevState => {
        prevState.pipes[pipe.pipeId] = this.generatePipe(pipe.pipeId, tick);
        return { pipes: prevState.pipes };
      });
    }

    let [x, y, direction] = [...pipe.startPos, pipe.startDirection];

    for (let i = 0; i < pipe.fullLength; i++) {
      [x, y, direction] = this.renderArc(pipe, tick, i, ctx, x, y, direction, startFade, finalTick);
    }
  }

  renderArc(pipe, tick, i, ctx, x, y, direction, startFade) {
    const startingOpacity = p.fadeInOut(i * pipe.speed, pipe.fullLength) * pipe.baseOpacity;

    let opacity = startingOpacity;
    if (tick - pipe.startingTick < i * pipe.speed) opacity = 0;
    if (tick >= startFade) {
      if (tick - startFade > i * pipe.speed) opacity = 0;
      else opacity = p.fadeInOut(i * pipe.speed - tick + startFade, pipe.fullLength) * pipe.baseOpacity;
    }

    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.beginPath();
    ctx.arc(x, y, pipe.pipeRadius, 0, p.TAU);
    ctx.stroke();
    ctx.closePath();

    let newDirection = direction;
    pipe.turns.forEach(t => {
      if (i === t[0]) newDirection = direction + (p.PI / 4) * t[1];
    });

    return [x + p.cos(newDirection), y + p.sin(newDirection), newDirection];
  }

  render() {
    return <canvas ref={this.canvas} className="pipeline__canvas" />;
  }
}

HomeHeaderPipeline.propTypes = {};
export default connect(
  null,
  null
)(HomeHeaderPipeline);

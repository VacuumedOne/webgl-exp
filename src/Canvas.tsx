import React, { Component } from 'react'
import WebGLUtil from './util/webgl';
import M from './util/minMatrix';
import './Canvas.css';

interface attribute {
  name: string,
  size: number,
  data: number[]
}

const position : number[] = [
  0.0, 1.0, 0.0,
  1.0, 0.0, 0.0,
  -1.0, 0.0, 0.0
];

let color : number[] = [
  1.0, 0.0, 0.0, 1.0,
  0.0, 1.0, 0.0, 1.0,
  0.0, 0.0, 1.0, 1.0
];

const attList : attribute[] = [
  {
    name: 'position',
    size: 3,
    data: position
  },
  {
    name: 'color',
    size: 4,
    data: color
  }
];


const vs_source : string = `
attribute vec3 position;
attribute vec4 color;
uniform mat4 mvpMatrix;
varying vec4 vColor;

void main(void){
  vColor = color;
  gl_Position = mvpMatrix * vec4(position, 1.0);
}
`;

const fs_source : string = `
precision mediump float;
varying vec4 vColor;

void main(void){
  gl_FragColor = vColor;
}
`;

export default class Canvas extends Component {
  render() {
    return (
      <div>
        <canvas id="canvas"></canvas>
      </div>
    )
  }
  componentDidMount() {
    //contextの取得
    const canvas : HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const gl : WebGLRenderingContext = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext;

    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    const vs : WebGLShader | null = WebGLUtil.createVertexShader(gl, vs_source);
    const fs : WebGLShader | null = WebGLUtil.createFragmentShader(gl, fs_source);
    if (!vs || !fs) return;

    const program : WebGLProgram | null = WebGLUtil.createProgram(gl, vs, fs);
    if (!program) return;

    const attLocation : number[] = [];
    const attStride : number[] = [];
    const VBOList : WebGLBuffer[] = [];

    attList.forEach((att, index) => {
      attLocation[index] = gl.getAttribLocation(program, att.name);
      attStride[index] = att.size;
      let vbo : WebGLBuffer | null = WebGLUtil.createVBO(gl, att.data);
      if (vbo) VBOList[index] = vbo;
    });

    WebGLUtil.setAttribute(gl, VBOList, attLocation, attStride);

    let mMat = M.scale(M.identity(), [2.0, 2.0, 1.0]);
    let vMat = M.lookAt([0.0, 1.0, 3.0], [0, 0, 0], [0, 1, 0]);
    let pMat = M.perspective(90, canvas.width / canvas.height, 0.1, 100);
    let mvpMat = M.multiply(M.multiply(pMat, vMat), mMat);

    let uniLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, 'mvpMatrix');
    if (!uniLocation) return;

    gl.uniformMatrix4fv(uniLocation, false, mvpMat);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.flush();

    // setInterval(this.MainLoop, 1000/30);
  }
  MainLoop() {
    
  }
}


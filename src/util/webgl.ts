class util {
  //WebGLShaderオブジェクトの生成
  static createVertexShader(gl: WebGLRenderingContext, vs: string) : WebGLShader | null {
    let shader : WebGLShader | null = gl.createShader(gl.VERTEX_SHADER);
    if (!shader) {
      return null;
    }
    //シェーダにソースを割り当てる
    gl.shaderSource(shader, vs);
    //シェーダのコンパイル
    gl.compileShader(shader);
    //コンパイルが成功したかチェック
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      return shader;
    } else {
      alert(gl.getShaderInfoLog(shader));
      return null;
    }
  }

  //WebGLShaderオブジェクトの生成
  static createFragmentShader(gl: WebGLRenderingContext, vs: string) : WebGLShader | null {
    let shader : WebGLShader | null = gl.createShader(gl.FRAGMENT_SHADER);
    if (!shader) {
      return null;
    }
    //シェーダにソースを割り当てる
    gl.shaderSource(shader, vs);
    //シェーダのコンパイル
    gl.compileShader(shader);
    //コンパイルが成功したかチェック
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      return shader;
    } else {
      alert(gl.getShaderInfoLog(shader));
      return null;
    }
  }

  //Vertex ShaderとFragment Shaderを結合したWebGLProgramを生成する
  static createProgram(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader) : WebGLProgram | null {
    let program : WebGLProgram | null = gl.createProgram();
    if (!program) {
      return null;
    }
    //シェーダの割り当て
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);

    //シェーダのリンク
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.useProgram(program);
      return program;
    } else {
      alert(gl.getProgramInfoLog(program));
      return null;
    }
  }

  //頂点バッファ (Vertex Buffer Object) の生成
  static createVBO(gl: WebGLRenderingContext, data: number[]) : WebGLBuffer | null {
    //バッファオブジェクトの生成
    let vbo : WebGLBuffer | null = gl.createBuffer();
    if (!vbo) {
      return null;
    }
    //バッファのバインド
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    //バッファにデータをセット
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    //バッファのバインドを無効化
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return vbo;
  }

  //インデックスバッファ (Index Buffer Object) の生成
  static createIBO(gl: WebGLRenderingContext, data: number[]) : WebGLBuffer | null {
    //バッファオブジェクトの生成
    let ibo : WebGLBuffer | null = gl.createBuffer();
    if (!ibo) {
      return null;
    }
    //バッファのバインド
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    //バッファにデータをセット
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
    //バッファのバインドを無効化
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    return ibo;
  }

  //頂点バッファのAttributeを結びつける。
  //locationは確保した位置の番号
  //strideは要素数
  static setAttribute(gl: WebGLRenderingContext, vboList: WebGLBuffer[], attLocation: number[], attStride: number[]) {
    for (let i in vboList) {
      gl.bindBuffer(gl.ARRAY_BUFFER, vboList[i]);
      gl.enableVertexAttribArray(attLocation[i]);
      gl.vertexAttribPointer(attLocation[i], attStride[i], gl.FLOAT, false, 0, 0);
    }
  }

  static createTexture(gl: WebGLRenderingContext, source: string, textures: (WebGLTexture | null)[], index: number) {
    let image: HTMLImageElement = new Image();

    image.onload = function() {
      //テクスチャオブジェクトの生成
      let texture : WebGLTexture | null = gl.createTexture();
      if (!texture) {
        return null
      }
      //テクスチャのバインド
      gl.bindTexture(gl.TEXTURE_2D, texture);
      //テクスチャへ画像をセット
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      //ミップマップを生成
      gl.generateMipmap(gl.TEXTURE_2D);
      //テクスチャのバインドを無効化
      gl.bindTexture(gl.TEXTURE_2D, null);
      //配列に代入
      textures[index] = texture;
    }

    image.src = source;
  }
}

export default util;
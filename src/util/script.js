//canvasとglの準備
let c;
let gl;
let textures = []

window.onload = function () {
  //準備
  c = document.getElementById('canvas')
  c.width = 600
  c.height = 600
  gl = c.getContext('webgl') || c.getContext('experimental-webgl')

  //お絵かき
  gl.clearColor(0.1, 0.1, 0.1, 1.0)
  gl.clearDepth(1.0);
  gl.clear(gl.COLOR_BUFFER_BIT)

  // 頂点シェーダとフラグメントシェーダの生成
  let v_shader = create_shader('vs');
  let f_shader = create_shader('fs');

  // プログラムオブジェクトの生成とリンク
  let prg = create_program(v_shader, f_shader);
  // attributeLocationの取得
  let attLocation = new Array();
  attLocation[0] = gl.getAttribLocation(prg, 'position');
  attLocation[1] = gl.getAttribLocation(prg, 'color');
  attLocation[2] = gl.getAttribLocation(prg, 'textureCoord');
  // attributeの要素数(この場合は xyz の3要素)
  let attStride = new Array();
  attStride[0] = 3;
  attStride[1] = 4;
  attStride[2] = 2;

  // 頂点の位置
  var position = [
    -1.0,  1.0,  0.0,
    1.0,  1.0,  0.0,
    -1.0, -1.0,  0.0,
    1.0, -1.0,  0.0
  ];

  // 頂点色
  var color = [
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0
  ];

  // テクスチャ座標
  var textureCoord = [
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    1.0, 1.0
  ];

  // 頂点インデックス
  var index = [
    0, 1, 2,
    3, 2, 1
  ];

  // VBOとIBOの生成
  var vPosition     = create_vbo(position);
  var vColor        = create_vbo(color);
  var vTextureCoord = create_vbo(textureCoord);
  var VBOList       = [vPosition, vColor, vTextureCoord];
  var iIndex        = create_ibo(index);

  // VBOとIBOの登録
  set_attribute(VBOList, attLocation, attStride);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iIndex);

  // uniformLocationの取得
  let uniLocation = new Array()
  uniLocation[0] = gl.getUniformLocation(prg, 'mvpMatrix');
  uniLocation[1] = gl.getUniformLocation(prg, 'texture0');
  uniLocation[2] = gl.getUniformLocation(prg, 'texture1');
  
  // minMatrix.js を用いた行列関連処理
  // matIVオブジェクトを生成
  let m = new matIV();
  
  // 各種行列の生成と初期化
  let mMatrix = m.identity(m.create()); //Model
  let vMatrix = m.identity(m.create()); //View
  let pMatrix = m.identity(m.create()); //Projection
  let tmpMatrix = m.identity(m.create());
  let mvpMatrix = m.identity(m.create());

  // ビュー座標変換行列
  m.lookAt([0.0, 2.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix);
  // プロジェクション座標変換行列
  m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
  // 各行列を掛け合わせ座標変換行列を完成させる
  m.multiply(pMatrix, vMatrix, tmpMatrix);

  //テクスチャの生成
  create_texture('texture0.png', 0)
  create_texture('texture1.png', 1)

  // カウンタの宣言
  let count = 0;

  //カリングと深度テスト
  gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	// gl.enable(gl.CULL_FACE);
    
  // 恒常ループ
  (function(){
      // canvasを初期化
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clearDepth(1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      
      // カウンタをインクリメントする
      count++;
      
      // カウンタを元にラジアンを算出
      let rad = (count % 360) * Math.PI / 180;

      //テクスチャユニットを指定してバインドし登録する
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, textures[0])
      gl.uniform1i(uniLocation[1], 0)
      //テクスチャユニットを指定してバインドし登録する
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, textures[1])
      gl.uniform1i(uniLocation[2], 1)

      // モデル座標変換行列の生成
      m.identity(mMatrix);
      m.rotate(mMatrix, rad, [0, 1, 1], mMatrix);
      m.multiply(tmpMatrix, mMatrix, mvpMatrix);

      // uniform変数の登録と描画
      gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
      gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

      // コンテキストの再描画
      gl.flush();
      
      // ループのために再帰呼び出し
      setTimeout(arguments.callee, 1000 / 30);
  })();
}


function create_shader(id){
  // シェーダを格納する変数
  let shader;
  // HTMLからscriptタグへの参照を取得
  let scriptElement = document.getElementById(id);
  // scriptタグが存在しない場合は抜ける
  if(!scriptElement){return;}
  // scriptタグのtype属性をチェック
  switch(scriptElement.type){
      // 頂点シェーダの場合
      case 'x-shader/x-vertex':
          shader = gl.createShader(gl.VERTEX_SHADER);
          break;
      // フラグメントシェーダの場合
      case 'x-shader/x-fragment':
          shader = gl.createShader(gl.FRAGMENT_SHADER);
          break;
      default :
          return;
  }
  // 生成されたシェーダにソースを割り当てる
  gl.shaderSource(shader, scriptElement.text);
  // シェーダをコンパイルする
  gl.compileShader(shader);
  // シェーダが正しくコンパイルされたかチェック
  if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
      // 成功していたらシェーダを返して終了
      return shader;
  }else{
      // 失敗していたらエラーログをアラートする
      alert(gl.getShaderInfoLog(shader));
  }
}

function create_program(vs, fs){
  // プログラムオブジェクトの生成
  let program = gl.createProgram();
  // プログラムオブジェクトにシェーダを割り当てる
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  // シェーダをリンク
  gl.linkProgram(program);
  // シェーダのリンクが正しく行なわれたかチェック
  if(gl.getProgramParameter(program, gl.LINK_STATUS)){
      // 成功していたらプログラムオブジェクトを有効にする
      gl.useProgram(program);
      // プログラムオブジェクトを返して終了
      return program;
  }else{
      // 失敗していたらエラーログをアラートする
      alert(gl.getProgramInfoLog(program));
  }
}

function create_vbo(data){
  // バッファオブジェクトの生成
  let vbo = gl.createBuffer();
  // バッファをバインドする
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  // バッファにデータをセット
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  // バッファのバインドを無効化
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  // 生成した VBO を返して終了
  return vbo;
}

function create_ibo(data) {
  //IBOの生成
  let ibo = gl.createBuffer();
  //バッファをバインドする
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  //バッファにデータをセット
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW)
  //バッファのバインドを無効化
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  //生成したIBOを返して終了
  return ibo
}

// テクスチャを生成する関数
function create_texture(source, index){
  // イメージオブジェクトの生成
  var img = new Image();
  
  // データのオンロードをトリガーにする
  img.onload = function(){
      // テクスチャオブジェクトの生成
      var tex = gl.createTexture();
      
      // テクスチャをバインドする
      gl.bindTexture(gl.TEXTURE_2D, tex);
      
      // テクスチャへイメージを適用
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      
      // ミップマップを生成
      gl.generateMipmap(gl.TEXTURE_2D);
      
      // テクスチャのバインドを無効化
      gl.bindTexture(gl.TEXTURE_2D, null);
      
      // 生成したテクスチャをグローバル変数に代入
      textures[index] = tex;
  };
  
  // イメージオブジェクトのソースを指定
  img.src = source;
}

function set_attribute(vbo, attL, attS){
  // 引数として受け取った配列を処理する
  for(let i in vbo){
    // バッファをバインドする
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);
    
    // attributeLocationを有効にする
    gl.enableVertexAttribArray(attL[i]);
    
    // attributeLocationを通知し登録する
    gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
  }
}

// トーラスを生成する関数
function torus(row, column, irad, orad, color){
  var pos = new Array(), nor = new Array(),
      col = new Array(), idx = new Array();
  for(var i = 0; i <= row; i++){
    var r = Math.PI * 2 / row * i;
    var rr = Math.cos(r);
    var ry = Math.sin(r);
    for(var ii = 0; ii <= column; ii++){
      var tr = Math.PI * 2 / column * ii;
      var tx = (rr * irad + orad) * Math.cos(tr);
      var ty = ry * irad;
      var tz = (rr * irad + orad) * Math.sin(tr);
      var rx = rr * Math.cos(tr);
      var rz = rr * Math.sin(tr);
      if(color){
        var tc = color;
      }else{
        tc = hsva(360 / column * ii, 1, 1, 1);
      }
      pos.push(tx, ty, tz);
      nor.push(rx, ry, rz);
      col.push(tc[0], tc[1], tc[2], tc[3]);
    }
  }
  for(i = 0; i < row; i++){
    for(ii = 0; ii < column; ii++){
      r = (column + 1) * i + ii;
      idx.push(r, r + column + 1, r + 1);
      idx.push(r + column + 1, r + column + 2, r + 1);
    }
  }
  return {p : pos, n : nor, c : col, i : idx};
}

// 球体を生成する関数
function sphere(row, column, rad, color){
  var pos = new Array(), nor = new Array(),
      col = new Array(), idx = new Array();
  for(var i = 0; i <= row; i++){
    var r = Math.PI / row * i;
    var ry = Math.cos(r);
    var rr = Math.sin(r);
    for(var ii = 0; ii <= column; ii++){
      var tr = Math.PI * 2 / column * ii;
      var tx = rr * rad * Math.cos(tr);
      var ty = ry * rad;
      var tz = rr * rad * Math.sin(tr);
      var rx = rr * Math.cos(tr);
      var rz = rr * Math.sin(tr);
      if(color){
        var tc = color;
      }else{
        tc = hsva(360 / row * i, 1, 1, 1);
      }
      pos.push(tx, ty, tz);
      nor.push(rx, ry, rz);
      col.push(tc[0], tc[1], tc[2], tc[3]);
    }
  }
  r = 0;
  for(i = 0; i < row; i++){
    for(ii = 0; ii < column; ii++){
      r = (column + 1) * i + ii;
      idx.push(r, r + 1, r + column + 2);
      idx.push(r, r + column + 2, r + column + 1);
    }
  }
  return {p : pos, n : nor, c : col, i : idx};
}

function hsva(h, s, v, a){
  if(s > 1 || v > 1 || a > 1){return;}
  let th = h % 360;
  let i = Math.floor(th / 60);
  let f = th / 60 - i;
  let m = v * (1 - s);
  let n = v * (1 - s * f);
  let k = v * (1 - s * (1 - f));
  let color = new Array();
  if(!s > 0 && !s < 0){
      color.push(v, v, v, a); 
  } else {
      let r = new Array(v, n, m, m, k, v);
      let g = new Array(k, v, v, n, m, m);
      let b = new Array(m, m, k, v, v, n);
      color.push(r[i], g[i], b[i], a);
  }
  return color;
}
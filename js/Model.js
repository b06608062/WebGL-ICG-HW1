class Model {
    constructor(dataPath) {
        this.dataPath = dataPath;
        this.vertexPositionBuffer = gl.createBuffer();
        this.vertexNormalBuffer = gl.createBuffer();
        this.vertexFrontColorBuffer = gl.createBuffer();
        this.vertexTextureCoordsBuffer = null;
        this.texture = null;
        this.angle = 180;
        this.translation = [0, 0, -50];
        this.rotation = [0, 1, 0];
        this.scale = [1, 1, 1];
    }

    loadModel(gl) {
        fetch(this.dataPath)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertexPositions), gl.STATIC_DRAW);
            this.vertexPositionBuffer.itemSize = 3;
            this.vertexPositionBuffer.numItems = data.vertexPositions.length / 3;
            
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertexNormals), gl.STATIC_DRAW);
            this.vertexNormalBuffer.itemSize = 3;
            this.vertexNormalBuffer.numItems = data.vertexNormals.length / 3;
    
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexFrontColorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertexFrontcolors), gl.STATIC_DRAW);
            this.vertexFrontColorBuffer.itemSize = 3;
            this.vertexFrontColorBuffer.numItems = data.vertexFrontcolors.length / 3;  
            
            if (data.vertexTextureCoords) {
                this.vertexTextureCoordsBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTextureCoordsBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertexTextureCoords), gl.STATIC_DRAW);
                this.vertexTextureCoordsBuffer.itemSize = 2;
                this.vertexTextureCoordsBuffer.numItems = data.vertexTextureCoords.length / 2;

                var img = new Image();
                img.onload = function () {
                    this.texture = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, this.texture);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
                }.bind(this);
                img.src = "./5.jpg";
            }
        }.bind(this))
        .catch(function (err) {
            console.log('error: ' + err);
        });
    }
    
    setUp(gl, shaderProgram, pMatrix, perspective, mvMatrix, shear, nMatrix, useTexture=false) {
        // Setup Projection Matrix
        mat4.perspective(perspective, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

        // Setup Model-View Matrix
        mat4.identity(mvMatrix);
        mat4.translate(mvMatrix, this.translation);
        mat4.rotate(mvMatrix, Model.degToRad(this.angle), this.rotation);
        mat4.multiply(mvMatrix, [1, 0, 0, 0, shear, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        mat4.scale(mvMatrix, this.scale);

        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);

        mat4.set(mvMatrix, nMatrix);
        mat4.inverse(nMatrix);
        mat4.transpose(nMatrix);
        gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, nMatrix);
        
        // Setup model position data
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
            this.vertexPositionBuffer.itemSize,
            gl.FLOAT,
            false,
            0,
            0);

        // Setup model vertex normal data
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute,
            this.vertexNormalBuffer.itemSize,
            gl.FLOAT,
            false,
            0,
            0);

        if (useTexture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1i(shaderProgram.samplerUniform, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTextureCoordsBuffer);
            gl.vertexAttribPointer(shaderProgram.textureCoordinateAttribute,
                this.vertexTextureCoordsBuffer.itemSize,
                gl.FLOAT,
                false,
                0,
                0);
        } else {
            // Setup model front color data
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexFrontColorBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexFrontColorAttribute,
                this.vertexFrontColorBuffer.itemSize,
                gl.FLOAT,
                false,
                0,
                0);
        }

        gl.drawArrays(gl.TRIANGLES, 0, this.vertexPositionBuffer.numItems);
    }

    static degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

};

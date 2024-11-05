class Bullet {
    constructor(x, y, mouseX, mouseY) {
        this.x = x;
        this.y = y;
        this.w = 28;
        this.h = 20;
        this.speed = 12;
        this.xv = 0;
        this.yv = 0;
        this.sprite = new Image();
        this.sprite.src = "public/sprites/bullet.png";

        //Calculate direction
        const DX = mouseX - this.x;
        const DY = mouseY - this.y;
        const DISTANCE = Math.sqrt(DX * DX + DY * DY);
        this.xv = (DX / DISTANCE) * this.speed;
        this.yv = (DY / DISTANCE) * this.speed;

        //Calculate angle
        this.angle = Math.atan2(2*Math.PI - DY, 2*Math.PI - DX);
    }

    physics() {
        this.x += this.xv;
        this.y += this.yv;
    }

    draw() {
        if (!this.sprite.complete) {
            return;
        }

        //Spritesheet stuff
        const frameWidth = this.sprite.width / 2;
        const frameHeight = this.sprite.height / 2;
        const totalFrames = 4;
        const fps = 12;
        const frameDuration = 1000 / fps;
        const currentFrame = Math.floor(Date.now() / frameDuration) % totalFrames;
        const sx = (currentFrame % 2) * frameWidth;
        const sy = Math.floor(currentFrame / 2) * frameHeight;

        //Draw the bullet
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        ctx.rotate(this.angle);
        ctx.drawImage(this.sprite, sx, sy, frameWidth, frameHeight, -this.w / 2, -this.h / 2, this.w, this.h);
        ctx.restore();
    }

    update() {
        this.physics();
    }
}
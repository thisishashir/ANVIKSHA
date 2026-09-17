// Module: Wind/Current Visualization
Ocean3d.widget.bindClass(
  mars3d.widget.BaseWidget.extend({
    options: {
      resources: ['./js/windy/Windy.js']
    },
    // Initialize [executed once]
    create: function () {},
    windy: null,
    timer: null,

    // Activate and open
    activate: function () {
      that = this
      that.viewer.mars.centerAt({
        x: 115.0543791631184,
        y: 9.711181640254974,
        z: 785284.8,
        heading: 352.7,
        pitch: -86.3,
        roll: 0.7
      })

      $.ajax({
        type: 'get',
        url: 'data/current/wind.json',
        dataType: 'json',
        success: function (response) {
          var header = response[0].header

          viewer.camera.setView({
            destination: Cesium.Rectangle.fromDegrees(
              header['lo1'],
              header['la2'],
              header['lo2'],
              header['la1']
            )
          })

          that.windy = new Windy(response, that.viewer)
          that.redraw()
        },
        error: function (errorMsg) {
          alert('Failed to request data!')
        }
      })
    },
    redraw: function () {
      that = this
      that.timer = setInterval(function () {
        that.windy.animate()
      }, 100)
    },
    // Deactivate and release
    disable: function () {
      if (this.windy) {
        this.windy.removeLines()
      }
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    }
  })
)

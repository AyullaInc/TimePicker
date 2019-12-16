/* Ayulla Timepicker */

if (typeof jQuery === 'undefined') { throw new Error('AyullaTimePicker requires jQuery'); }

(function($) {

    var Time = function (hour, minute) {
        this.hour = hour;
        this.minute = minute;

        this.format = function(format, hourPadding) {
            var that = this, is24Hour = (format.match(/h/g) || []).length > 1;

            return $.trim(format.replace(/(hh|h|mm|ss|tt|t)/g, function (e) {
                switch(e.toLowerCase()){
                    case 'h':
                        var hour = that.getHour(true);

                        return (hourPadding && hour < 10 ? '0' + hour : hour);
                    case 'hh': return (that.hour < 10 ? '0' + that.hour : that.hour);
                    case 'mm': return (that.minute < 10 ? '0' + that.minute : that.minute);
                    case 'ss': return '00';
                    case 't': return is24Hour ? '' : that.getT().toLowerCase();
                    case 'tt': return is24Hour ? '' : that.getT();
                }
            }));
        };

        this.setHour = function (value) { this.hour = value; };
        this.getHour = function (is12Hour) { return is12Hour ? this.hour === 0 || this.hour === 12 ? 12 : (this.hour % 12) : this.hour; };
        this.invert = function () {
            if (this.getT() === 'AM') this.setHour(this.getHour() + 12);
            else this.setHour(this.getHour() - 12);
        };
        this.setMinutes = function (value) { this.minute = value; }
        this.getMinutes = function (value) { return this.minute; }
        this.getT = function() { return this.hour < 12 ? 'AM' : 'PM'; };
    };

    var AyullaTimePicker = function (input, config) {

        var that = this;

        this.config = config;

        this.activeView = 'hours';
        this.input = $(input);
        this.hTimeout = null;
		this.mTimeout = null;
		this.time = new Time(0, 0);
		this.selected = new Time(0,0);
        this.timepicker = {
            container: $('<div class="atp-container"></div>'),
            timeContainer: {
                container: $('<div class="atp-time-container"></div>'),
                hour: $('<span class="atp-time-hour">12</span>'),
                dots: $('<span class="atp-time-dots">:</span>'),
                minute: $('<span class="atp-time-minute">00</span>'),
                meridiem: $('<span class="atp-time-meridiem">AM</span>')
            },
            clockContainer : {
                container: $('<div class="atp-clock-container"></div>'),
                am: $('<span class="atp-am">AM</span>'),
                pm: $('<span class="atp-pm">PM</span>'),
                clock: {
                    container: $('<div class="atp-clock"></div>'),
                    dot: $('<span class="atp-clock-dot"></span>'),
                    hours: $('<div class="atp-hour-container"></div>'),
                    minutes: $('<div class="atp-minute-container"></div>')
                }
            }
        };

        var timePicker = this.timepicker;

        this.setup(timePicker).appendTo('body');

        timePicker.clockContainer.am.click(function (e) {
            if (that.selected.getT() !== 'AM') that.setT('am');
            that.setValue(that.selected);
            e.stopPropagation();
        });

        timePicker.clockContainer.pm.click(function (e) {
            if (that.selected.getT() !== 'PM') that.setT('pm');
            that.setValue(that.selected);
            e.stopPropagation();
        });
		timePicker.timeContainer.hour.click(function (e) {
		    if (that.activeView !== 'hours') that.switchView('hours');
		    e.stopPropagation();
		});

		timePicker.timeContainer.minute.click(function (e) {
		    if (that.activeView !== 'minutes') that.switchView('minutes');
		    e.stopPropagation();
		});

		$(document).click(function (e) {
			that.hide();
        });


		this.input.click(function (e) {
			$('.atp-container').addClass('animate');
            that.show();
            e.stopPropagation();
        }).prop('readonly', that.config.readOnly);


		$('.atp-container').click(function (e) {
			e.stopPropagation();
        });


		if (this.input.val() !== '') {
			var time = this.parseTime(this.input.val());

			this.setValue(time);
		} else {
			var time = this.returnSystemTime();

			this.time = new Time(time.hour, time.minute);
		}

		$("body").on('click',".atp-digit span",function (e){
		  	e.stopPropagation();
		});

		this.resetSelected();
		this.switchView(this.activeView);

		this.hide();
    };

    AyullaTimePicker.prototype = {
        constructor: AyullaTimePicker,

        setup : function (timePicker) {

            var that = this;

            if (typeof timePicker === 'undefined') throw new Error('Expecting a value.');
            var container = timePicker.container, timeContainer = timePicker.timeContainer, clockContainer = timePicker.clockContainer;

            //build time container
            timeContainer.container.append(timeContainer.hour).append(timeContainer.dots).append(timeContainer.minute).append(timeContainer.meridiem).appendTo(container);

            // Setup hours
			for (var i = 0; i < 12; i++) {
				var value = i + 1, deg = (120 + (i * 30)) % 360,
					hour = $('<div class="atp-digit rotate-' + deg + '" data-hour="' + value + '"><span>'+ value +'</span></div>');

				hour.find('span').click(function (e) {
					var _data = parseInt($(this).parent().data('hour')),
						_selectedT = that.selected.getT(),
						_value = (_data + ((_selectedT === 'PM' && _data < 12) || (_selectedT === 'AM' && _data === 12) ? 12 : 0)) % 24;

					that.setHour(_value);
					that.switchView('minutes');
					e.stopPropagation();
				});

				clockContainer.clock.hours.append(hour);
			}

			// Setup minutes
			for (var i = 0; i < 60; i++) {
				var min = i < 10 ? '0' + i : i, deg = (90 + (i * 6)) % 360,
					minute = $('<div class="atp-digit rotate-' + deg + '" data-minute="' + i + '"></div>');

				if (i % 5 === 0) minute.addClass('marker').html('<span>' + min + '</span>');
				else minute.html('<span></span>');

				minute.find('span').click(function (e) {
					that.setMinute($(this).parent().data('minute'));
					e.stopPropagation();
				});

				clockContainer.clock.minutes.append(minute);
			}

            //build clock container
            clockContainer.clock.container.append(clockContainer.am).append(clockContainer.pm).append(clockContainer.clock.dot).append(clockContainer.clock.hours).append(clockContainer.clock.minutes).appendTo(clockContainer.container);

			clockContainer.container.appendTo(container);

            return container;
        },

        setHour : function (hour) {
			if (typeof hour === 'undefined') throw new Error('Expecting a value.');

			var timepicker = this.timepicker;
			var that = this;

			this.selected.setHour(hour);
			timepicker.timeContainer.hour.text(this.selected.getHour(true));

			var activatedTime = this.selected.getHour(true);
			timepicker.clockContainer.clock.hours.children('div').each(function (idx, div) {
				var el = $(div), val = el.data('hour');
				el[val === that.selected.getHour(true) ? 'addClass' : 'removeClass']('active');
			});
		},

		setMinute : function (minute) {
			if (typeof minute === 'undefined') throw new Error('Expecting a value.');

			this.selected.setMinutes(minute);
			this.timepicker.timeContainer.minute.text(minute < 10 ? '0' + minute : minute);

			this.timepicker.clockContainer.clock.minutes.children('div').each(function (idx, div) {
				var el = $(div), val = el.data('minute');

				el[val === minute ? 'addClass' : 'removeClass']('active');
			});

			this.setValue(this.selected);
		},

        setT : function (value) {
			if (typeof value === 'undefined') throw new Error('Expecting a value.');

			if (this.selected.getT() !== value.toUpperCase()) this.selected.invert();

			var t = this.selected.getT();

			this.timepicker.timeContainer.meridiem.text(t);
			this.timepicker.clockContainer.am[t === 'AM' ? 'addClass' : 'removeClass']('active');
			this.timepicker.clockContainer.pm[t === 'PM' ? 'addClass' : 'removeClass']('active');
		},

        setValue : function (value) {
			if (typeof value === 'undefined') throw new Error('Expecting a value.');

			var time = typeof value === 'string' ? this.parseTime(value) : value;

			this.time = new Time(time.hour, time.minute);

			var formatted = this.returnFormattedTime();

			this.input.val(formatted.value)
				.attr('data-time', formatted.time)
				.attr('value', formatted.value);
		},

		hide : function () {
			var that = this;

			that.timepicker.container.addClass('animate');
			setTimeout(function() {
				that.switchView('hours');
				//that.timepicker.container.addClass('hidden').removeClass('animate');

				$('body').removeAttr('mdtimepicker-display');

				that.visible = false;
				that.input.focus();
			}, 300);
		},

        parseTime : function (time) {

        },

        show : function () {
			var that = this;



			if (that.input.val() === '') {
				var time = that.getSystemTime();
				this.time = new Time(time.hour, time.minute);
			}
			$(that.timepicker.container).css({'left': that.input.offset().left + 175 + 'px', 'top': that.input.offset().top + that.input.height() + 10 + 'px'});

			that.resetSelected();

			$('body').attr('mdtimepicker-display', 'on');

			that.timepicker.container.removeClass('hidden').addClass('animate');
			setTimeout(function() {
				that.timepicker.container.removeClass('animate');

				that.visible = true;
				that.input.blur();
			}, 10);


		},

        switchView : function (view) {

            var that = this;
			if (view !== 'hours' && view !== 'minutes') return;


			this.activeView = view;
			this.timepicker.clockContainer.clock.hours.addClass('hidden');
            this.timepicker.clockContainer.clock.minutes.addClass('hidden');

			this.timepicker.timeContainer.hour[view === 'hours' ? 'addClass' : 'removeClass']('active');
			this.timepicker.timeContainer.minute[view === 'hours' ? 'removeClass' : 'addClass']('active');

			this.timepicker.clockContainer.clock.hours.addClass('animate');
			if (view === 'hours') this.timepicker.clockContainer.clock.hours.removeClass('hidden');

			clearTimeout(this.hTimeout);

			that.hTimeout = setTimeout(function() {
				if (view !== 'hours') that.timepicker.clockContainer.clock.hours.addClass('hidden');
				that.timepicker.clockContainer.clock.hours.removeClass('animate');
			}, view === 'hours' ? 20 : 300);

			this.timepicker.clockContainer.clock.minutes.addClass('animate');
			if (view === 'minutes') this.timepicker.clockContainer.clock.minutes.removeClass('hidden');

			clearTimeout(this.mTimeout);

			this.mTimeout = setTimeout(function() {
				if (view !== 'minutes') that.timepicker.clockContainer.clock.minutes.addClass('hidden');
				that.timepicker.clockContainer.clock.minutes.removeClass('animate');
			}, view === 'minutes' ? 20 : 300);

			this.setValue(this.selected);
		},

        resetSelected : function () {
			this.setHour(this.time.hour);
			this.setMinute(this.time.minute);
			this.setT(this.time.getT());
		},

        returnFormattedTime : function () {
			var time = this.time.format(this.config.timeFormat, false),
				tValue = this.time.format(this.config.format, this.config.hourPadding);

			return { time: time, value: tValue };
		},

        returnSystemTime : function () {
			var now = new Date();

			return new Time (now.getHours(), now.getMinutes());
		},
    };

    $.fn.AyullaTimePicker = function (config) {
		return $(this).each(function (idx, el) {

			var picker = $(this).data('AyullaTimePicker');

			options = $.extend({}, $.fn.AyullaTimePicker.defaults, $(this).data(), typeof config === 'object' && config);

			if (!picker) {
				$(this).data('AyullaTimePicker', (picker = new AyullaTimePicker($(this), options)));
			}
			if(typeof config === 'string') picker[config]();

			$(document).on('keydown', function (e) {
				if(e.keyCode !== 27) return;

				if (picker.visible) picker.hide();
			});
		});
	};

	$.fn.AyullaTimePicker.defaults = {
		timeFormat: 'hh:mm:ss.000',	// format of the time value (data-time attribute)
		format: 'h:mm tt',			// format of the input value
		theme: 'blue',				// theme of the timepicker
		readOnly: true,				// determines if input is readonly
		hourPadding: false			// determines if display value has zero padding for hour value less than 10 (i.e. 05:30 PM); 24-hour format has padding by default
	};

}(jQuery));
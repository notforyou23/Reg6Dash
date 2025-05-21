Weather device parameters

Getting Device Detail

Developers can obtain personal device details through Application Key and API Key.

Request to： https://api.ecowitt.net/api/v3/device/info

Return Data format： JSON

Request Type： GET

Example： https://api.ecowitt.net/api/v3/device/info?application_key=APPLICATION_KEY&api_key=API_KEY&mac=Your_MAC

Request Parameters：

Parameter	Type	MANDATORY	Remark
application_key	String	Yes	obtained application key
api_key	String	Yes	obtained api key
mac	String	No	Device MAC(eg.”FF:FF:FF:FF:FF:FF”;”mac” and “imei” can’t be null at same time)
imei	String	No	Device IMEI(eg.”863879049793071”;”mac” and “imei” can’t be null at same time)
temp_unitid	Integer	No	Temperature unit：（default）”2” for unit in ℉，”1” for unit in ℃
pressure_unitid	Integer	No	Pressure unit：（default）”4” for inHg，”3” for hPa，”5” for mmHg
wind_speed_unitid	Integer	No	Wind speed unit：（default）”9” for mph，”6” for m/s，”7” for km/h，”8” for knots，”10” for BFT，”11” for fpm
rainfall_unitid	Integer	No	Rain unit：（default）”13” for in，”12” for mm
solar_irradiance_unitid	Integer	No	Solar Irradiance：（default）”16” for W/m²，”14” for lux，”15” for fc
capacity_unitid	Integer	No	Capacity:(default)“24” for L，“25” for m³，“26” for gal

Getting Device History Data

With Application Key, API Key, MAC/IMEI and time duration defined, the history data can be obtained with the following rules attached：

5 minutes resolution data within the past 90days, each data request time span should not be longer than a complete day；
30 minutes resolution data within the past 365days, each data request time span should not be longer than a complete week；
240 minutes resolution data within the past 730days, each data request time span should not be longer than a complete month；
24 hours resolution data within the past 1460days, each data request time span should not be longer than a complete year;
24 hours resolution data within the past 7days, each data request time span should not be longer than a complete day;
Request to： https://api.ecowitt.net/api/v3/device/history

Return Data format： JSON

Request Type： GET

Example： https://api.ecowitt.net/api/v3/device/history?application_key=APPLICATION_KEY&api_key=API_KEY&mac=YOUR_MAC_CODE_OF_DEVICE&start_date=2022-01-01 00:00:00&end_date=2022-01-01 23:59:59&cycle_type=auto&call_back=outdoor,indoor.humidity

Request Parameters：

Parameter	Type	Required	Description
application_key	String	Yes	obtained application key
api_key	String	Yes	obtained api key
mac	String	No	Device MAC(eg.”FF:FF:FF:FF:FF:FF”;”mac” and “imei” can’t be null at same time)
imei	String	No	Device IMEI(eg.”863879049793071”;”mac” and “imei” can’t be null at same time)
start_date	String	Yes	Start time of data query (including the given time point), format: ISO8601.
end_date	String	Yes	End time of data query (including the given time point), format: ISO8601.
call_back	String	Yes	Returned field types are supported, including: outdoor (outdoor group), camera (camera group), WFC01-0xxxxxx8 (Device Default Title，Sub-device group), and other field queries.
cycle_type	String	No	Inquiry Data type : time span will automatically define data resolution applied for 5 minutes, 30 minutes 240minutes or 24hours(eg.”auto”,”5min”,”30min”,”4hour”,”1day”)
temp_unitid	Integer	No	Temperature unit:(default)”2” for unit in ℉,”1” for unit in ℃
pressure_unitid	Integer	No	Pressure unit:(default)”4”for inHg,”3” for hPa,”5” for mmHg
wind_speed_unitid	Integer	No	Wind speed unit:(default)”9” for mph,”6” for m/s,”7” for km/h,”8” for knots,”10” for BFT,”11” for fpm
rainfall_unitid	Integer	No	Rain unit:(default)”13” for in,”12” for mm
solar_irradiance_unitid	Integer	No	Solar Irradiance:(default)”16” for W/m²,”14” for lux,”15” for fc

Getting Device Real-Time Data

Developer may obtain data within the past 2hrs via its application Key, API key, Mac/IMEI and meteorological data. Or the latest data of camera within 24hrs.

Request to： https://api.ecowitt.net/api/v3/device/real_time

Return Data format： JSON

Request Type： GET

Example： https://api.ecowitt.net/api/v3/device/real_time?application_key=APPLICATION_KEY&api_key=API_KEY&mac=YOUR_MAC_CODE_OF_DEVICE&call_back=all

Interface note： The real-time data of meteorological equipment, camera equipment, and sub-devices are obtained by querying the application key of the calling interface, the key of the calling interface, and the MAC/IMEI identification code of the equipment.

Request Parameters：

Parameter	Type	Required	Description
application_key	String	Yes	obtained application key
api_key	String	Yes	obtained api key
mac	String	No	Device MAC(eg.”FF:FF:FF:FF:FF:FF”;”mac” and “imei” can’t be null at same time)
imei	String	No	Device IMEI(eg.”863879049793071”;”mac” and “imei” can’t be null at same time)
call_back	String	No	The supported returned field types include: outdoor (outdoor group), camera (camera group), WFC01-0xxxxxx8 (Default Title, Sub-device group), and other field queries.
temp_unitid	Integer	No	Temperature unit:(default)”2” for unit in ℉,”1” for unit in ℃
pressure_unitid	Integer	No	Pressure unit:(default)”4” for inHg,”3” for hPa,”5” for mmHg
wind_speed_unitid	Integer	No	Wind speed unit:(default)”9” for mph,”6” for m/s,”7” for km/h,”8” for knots,”10” for BFT,”11” for fpm
rainfall_unitid	Integer	No	Rain unit:(default)”13” for in,”12” for mm
solar_irradiance_unitid	Integer	No	Solar Irradiance:(default)”16” for W/m²,”14” for lux,”15” for fc
capacity_unitid	Integer	No	Capacity:(default)“24” for L，“25” for m³，“26” for gal
API Usage Instructions:

application_key and api_key are mandatory parameters for authentication.
At least one of the mac or imei parameters must be provided to identify the device.
Use the call_back parameter to customize the content of the returned data. It allows specifying specific fields or device types. Multiple field queries can be included, separated by commas, such as outdoor.temp, indoor.humidity, or WFC01-0xxxxxx8.daily.
Set unit parameters as needed, such as the temperature unit (temp_unitid) or wind speed unit (wind_speed_unitid).

Response：

At normal condition, the platform will pass the following data packet in JSON format：

{
    "code": 0,
    "msg": "success",
    "time": "1645602867",
    "data": {
        "id": 944,
        "name": "test1",
        "mac": "25:25:25:25:25:25",
        "type": 1,
        "date_zone_id": "Asia/Shanghai",
        "createtime": 1636684950,
        "longitude": 113.9147,
        "latitude": 22.574,
        "stationtype": "WEB_Test_Tool",
        "last_update": {
            "outdoor": {
                "temperature": {
                    "time": "1645596032",
                    "unit": "°F",
                    "value": "127.7"
                },
                "feels_like": {
                    "time": "1645596032",
                    "unit": "°F",
                    "value": "127.7"
                },
                "app_temp": {
                    "time": "1645596032",
                    "unit": "°F",
                    "value": "46.6"
                },
                "dew_point": {
                    "time": "1645596032",
                    "unit": "°F",
                    "value": "104.6"
                },
                "humidity": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "52"
                }
            },
            "indoor": {
                "temperature": {
                    "time": "1645596032",
                    "unit": "°F",
                    "value": "63.7"
                },
                "humidity": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "70"
                }
            },
            "solar_and_uvi": {
                "solar": {
                    "time": "1645596032",
                    "unit": "W/m²",
                    "value": "101.8"
                },
                "uvi": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "7"
                }
            },
            "rainfall": {
                "rain_rate": {
                    "time": "1645596032",
                    "unit": "in/hr",
                    "value": "242.56"
                },
                "daily": {
                    "time": "1645596032",
                    "unit": "in",
                    "value": "332.69"
                },
                "event": {
                    "time": "1645596032",
                    "unit": "in",
                    "value": "245.56"
                },
                "hourly": {
                    "time": "1645596032",
                    "unit": "in",
                    "value": "312.33"
                },
                "weekly": {
                    "time": "1645596032",
                    "unit": "in",
                    "value": "372.53"
                },
                "monthly": {
                    "time": "1645596032",
                    "unit": "in",
                    "value": "247.86"
                },
                "yearly": {
                    "time": "1645596032",
                    "unit": "in",
                    "value": "8.25"
                }
            },
            "rainfall_piezo": {
                "rain_rate": {
                    "time": "1645596032",
                    "unit": "in/hr",
                    "value": "267.62"
                },
                "daily": {
                    "time": "1645596032",
                    "unit": "in",
                    "value": "223.72"
                },
                "event": {
                    "time": "1645596032",
                    "unit": "in",
                    "value": "179.51"
                },
                "hourly": {
                    "time": "1645596032",
                    "unit": "in",
                    "value": "38.61"
                },
                "weekly": {
                    "time": "1645596032",
                    "unit": "in",
                    "value": "120.84"
                },
                "monthly": {
                    "time": "1645596032",
                    "unit": "in",
                    "value": "20.31"
                },
                "yearly": {
                    "time": "1645596032",
                    "unit": "in",
                    "value": "339.32"
                }
            },
            "wind": {
                "wind_speed": {
                    "time": "1645596032",
                    "unit": "mph",
                    "value": "46.9"
                },
                "wind_gust": {
                    "time": "1645596032",
                    "unit": "mph",
                    "value": "102.7"
                },
                "wind_direction": {
                    "time": "1645596032",
                    "unit": "º",
                    "value": "267"
                }
            },
            "pressure": {
                "relative": {
                    "time": "1645596032",
                    "unit": "inHg",
                    "value": "26.34"
                },
                "absolute": {
                    "time": "1645596032",
                    "unit": "inHg",
                    "value": "25.59"
                }
            },
            "lightning": {
                "distance": {
                    "time": "1645595889",
                    "unit": "mi",
                    "value": "19"
                },
                "count": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "29414"
                }
            },
            "indoor_co2": {
                "co2": {
                    "time": "1645596032",
                    "unit": "ppm",
                    "value": "21493"
                },
                "24_hours_average": {
                    "time": "1645596032",
                    "unit": "ppm",
                    "value": "13213"
                }
            },
            "co2_aqi_combo": {
                "co2": {
                    "time": "1645596032",
                    "unit": "ppm",
                    "value": "16006"
                },
                "24_hours_average": {
                    "time": "1645596032",
                    "unit": "ppm",
                    "value": "7094"
                }
            },
            "pm25_aqi_combo": {
                "real_time_aqi": {
                    "time": "1645596032",
                    "unit": "µg/m3",
                    "value": "154"
                },
                "pm25": {
                    "time": "1645596032",
                    "unit": "µg/m3",
                    "value": "61"
                },
                "24_hours_aqi": {
                    "time": "1645596032",
                    "unit": "µg/m3",
                    "value": "493"
                }
            },
            "pm10_aqi_combo": {
                "real_time_aqi": {
                    "time": "1645596032",
                    "unit": "µg/m3",
                    "value": "500"
                },
                "pm10": {
                    "time": "1645596032",
                    "unit": "µg/m3",
                    "value": "884"
                },
                "24_hours_aqi": {
                    "time": "1645596032",
                    "unit": "µg/m3",
                    "value": "155"
                }
            },
            "pm1_aqi_combo": {
                "real_time_aqi": {
                    "time": "1645596032",
                    "unit": "µg/m3",
                    "value": "154"
                },
                "pm1": {
                    "time": "1645596032",
                    "unit": "µg/m3",
                    "value": "61"
                },
                "24_hours_aqi": {
                    "time": "1645596032",
                    "unit": "µg/m3",
                    "value": "493"
                }
            },
            "pm4_aqi_combo": {
                "real_time_aqi": {
                    "time": "1645596032",
                    "unit": "µg/m3",
                    "value": "154"
                },
                "pm4": {
                    "time": "1645596032",
                    "unit": "µg/m3",
                    "value": "61"
                },
                "24_hours_aqi": {
                    "time": "1645596032",
                    "unit": "µg/m3",
                    "value": "493"
                }
            },
            "t_rh_aqi_combo": {
                "temperature": {
                    "time": "1645596032",
                    "unit": "°F",
                    "value": "57.2"
                },
                "humidity": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "96"
                }
            },
            "water_leak": {
                "leak_ch1": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "1"
                },
                "leak_ch2": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "2"
                },
                "leak_ch3": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "1"
                },
                "leak_ch4": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "1"
                }
            },
            "pm25_ch1": {
                "real_time_aqi": {
                    "time": "1645602837",
                    "unit": "µg/m3",
                    "value": "500"
                },
                "pm25": {
                    "time": "1645602837",
                    "unit": "µg/m3",
                    "value": "508"
                },
                "24_hours_aqi": {
                    "time": "1645602837",
                    "unit": "µg/m3",
                    "value": "500"
                }
            },
            "pm25_ch2": {
                "real_time_aqi": {
                    "time": "1645596032",
                    "unit": "µg/m3",
                    "value": "170"
                },
                "pm25": {
                    "time": "1645596032",
                    "unit": "µg/m3",
                    "value": "93"
                },
                "24_hours_aqi": {
                    "time": "1645596032",
                    "unit": "µg/m3",
                    "value": "500"
                }
            },
            "pm25_ch3": {
                "real_time_aqi": {
                    "time": "1645596032",
                    "unit": "µg/m3",
                    "value": "500"
                },
                "pm25": {
                    "time": "1645596032",
                    "unit": "µg/m3",
                    "value": "550"
                },
                "24_hours_aqi": {
                    "time": "1645596032",
                    "unit": "µg/m3",
                    "value": "485"
                }
            },
            "pm25_ch4": {
                "real_time_aqi": {
                    "time": "1645596032",
                    "unit": "µg/m3",
                    "value": "307"
                },
                "pm25": {
                    "time": "1645596032",
                    "unit": "µg/m3",
                    "value": "257"
                },
                "24_hours_aqi": {
                    "time": "1645596032",
                    "unit": "µg/m3",
                    "value": "500"
                }
            },
            "temp_and_humidity_ch1": {
                "temperature": {
                    "time": "1645596032",
                    "unit": "°F",
                    "value": "70.0"
                },
                "humidity": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "85"
                }
            },
            "temp_and_humidity_ch2": {
                "temperature": {
                    "time": "1645596032",
                    "unit": "°F",
                    "value": "69.6"
                },
                "humidity": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "95"
                }
            },
            "temp_and_humidity_ch3": {
                "temperature": {
                    "time": "1645596032",
                    "unit": "°F",
                    "value": "128.0"
                },
                "humidity": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "69"
                }
            },
            "temp_and_humidity_ch4": {
                "temperature": {
                    "time": "1645596032",
                    "unit": "°F",
                    "value": "91.4"
                },
                "humidity": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "23"
                }
            },
            "temp_and_humidity_ch5": {
                "temperature": {
                    "time": "1645596032",
                    "unit": "°F",
                    "value": "135.9"
                },
                "humidity": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "0"
                }
            },
            "temp_and_humidity_ch6": {
                "temperature": {
                    "time": "1645596032",
                    "unit": "°F",
                    "value": "98.9"
                },
                "humidity": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "32"
                }
            },
            "temp_and_humidity_ch7": {
                "temperature": {
                    "time": "1645596032",
                    "unit": "°F",
                    "value": "-27.2"
                },
                "humidity": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "22"
                }
            },
            "temp_and_humidity_ch8": {
                "temperature": {
                    "time": "1645596032",
                    "unit": "°F",
                    "value": "78.4"
                },
                "humidity": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "11"
                }
            },
            "soil_ch1": {
                "soilmoisture": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "79"
                },
                "ad": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "163"
                }
            },
            "soil_ch2": {
                "soilmoisture": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "19"
                },
                "ad": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "43"
                }
            },
            "soil_ch3": {
                "soilmoisture": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "37"
                },
                "ad": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "64"
                }
            },
            "soil_ch4": {
                "soilmoisture": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "55"
                },
                "ad": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "48"
                }
            },
            "soil_ch5": {
                "soilmoisture": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "47"
                },
                "ad": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "306"
                }
            },
            "soil_ch6": {
                "soilmoisture": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "31"
                },
                "ad": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "66"
                }
            },
            "soil_ch7": {
                "soilmoisture": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "30"
                },
                "ad": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "56"
                }
            },
            "soil_ch8": {
                "soilmoisture": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "46"
                },
                "ad": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "39"
                }
            },
            "soil_ch9": {
                "soilmoisture": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "5"
                },
                "ad": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "4"
                }
            },
            "soil_ch10": {
                "soilmoisture": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "0"
                },
                "ad": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "5"
                }
            },
            "soil_ch11": {
                "soilmoisture": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "0"
                },
                "ad": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "55"
                }
            },
            "soil_ch12": {
                "soilmoisture": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "0"
                },
                "ad": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "60"
                }
            },
            "soil_ch13": {
                "soilmoisture": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "0"
                },
                "ad": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "66"
                }
            },
            "soil_ch14": {
                "soilmoisture": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "0"
                },
                "ad": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "56"
                }
            },
            "soil_ch15": {
                "soilmoisture": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "0"
                },
                "ad": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "161"
                }
            },
            "soil_ch16": {
                "soilmoisture": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "0"
                },
                "ad": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "59"
                }
            },
            "temp_ch1": {
                "temperature": {
                    "time": "1645596032",
                    "unit": "°F",
                    "value": "64.3"
                }
            },
            "temp_ch2": {
                "temperature": {
                    "time": "1645596032",
                    "unit": "°F",
                    "value": "104.9"
                }
            },
            "temp_ch3": {
                "temperature": {
                    "time": "1645596032",
                    "unit": "°F",
                    "value": "119.3"
                }
            },
            "temp_ch4": {
                "temperature": {
                    "time": "1645596032",
                    "unit": "°F",
                    "value": "-8.4"
                }
            },
            "temp_ch5": {
                "temperature": {
                    "time": "1645596032",
                    "unit": "°F",
                    "value": "36.5"
                }
            },
            "temp_ch6": {
                "temperature": {
                    "time": "1645596032",
                    "unit": "°F",
                    "value": "69.8"
                }
            },
            "temp_ch7": {
                "temperature": {
                    "time": "1645596032",
                    "unit": "°F",
                    "value": "129.0"
                }
            },
            "temp_ch8": {
                "temperature": {
                    "time": "1645596032",
                    "unit": "°F",
                    "value": "-32.1"
                }
            },
            "leaf_ch1": {
                "leaf_wetness": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "73"
                }
            },
            "leaf_ch2": {
                "leaf_wetness": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "62"
                }
            },
            "leaf_ch3": {
                "leaf_wetness": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "27"
                }
            },
            "leaf_ch4": {
                "leaf_wetness": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "35"
                }
            },
            "leaf_ch5": {
                "leaf_wetness": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "82"
                }
            },
            "leaf_ch6": {
                "leaf_wetness": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "73"
                }
            },
            "leaf_ch7": {
                "leaf_wetness": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "86"
                }
            },
            "leaf_ch8": {
                "leaf_wetness": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "75"
                }
            },
            "battery": {
                "t_rh_p_sensor": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "1"
                },
                "ws1900_console": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "1.07"
                },
                "ws1800_console": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "2.79"
                },
                "ws6006_console": {
                    "time": "1645596032",
                    "unit": "%",
                    "value": "45"
                },
                "console": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "3.98"
                },
                "outdoor_t_rh_sensor": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "0"
                },
                "wind_sensor": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "1.02"
                },
                "ws90_sensor_battery": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "2.78"
                },
                "ws80_sensor": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "1.71"
                },
                "rainfall_sensor": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "0.3"
                },
                "ws65_67_69_sensor": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "1"
                },
                "lightning_sensor": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "2"
                },
                "aqi_combo_sensor": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "1"
                },
                "water_leak_sensor_ch1": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "5"
                },
                "water_leak_sensor_ch2": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "2"
                },
                "water_leak_sensor_ch3": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "2"
                },
                "water_leak_sensor_ch4": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "3"
                },
                "pm25_sensor_ch1": {
                    "time": "1645602837",
                    "unit": "",
                    "value": "6"
                },
                "pm25_sensor_ch2": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "6"
                },
                "pm25_sensor_ch3": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "4"
                },
                "pm25_sensor_ch4": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "1"
                },
                "temp_humidity_sensor_ch1": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "1"
                },
                "temp_humidity_sensor_ch2": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "1"
                },
                "temp_humidity_sensor_ch3": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "1"
                },
                "temp_humidity_sensor_ch4": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "0"
                },
                "temp_humidity_sensor_ch5": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "1"
                },
                "temp_humidity_sensor_ch6": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "0"
                },
                "temp_humidity_sensor_ch7": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "1"
                },
                "temp_humidity_sensor_ch8": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "0"
                },
                "soilmoisture_sensor_ch1": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "1.3"
                },
                "soilmoisture_sensor_ch2": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "0.0"
                },
                "soilmoisture_sensor_ch3": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "1.1"
                },
                "soilmoisture_sensor_ch4": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "1.0"
                },
                "soilmoisture_sensor_ch5": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "0.9"
                },
                "soilmoisture_sensor_ch6": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "0.1"
                },
                "soilmoisture_sensor_ch7": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "1.9"
                },
                "soilmoisture_sensor_ch8": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "0.5"
                },
                "temperature_sensor_ch1": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "0.77"
                },
                "temperature_sensor_ch2": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "1.15"
                },
                "temperature_sensor_ch3": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "1.50"
                },
                "temperature_sensor_ch4": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "0.65"
                },
                "temperature_sensor_ch5": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "1.99"
                },
                "temperature_sensor_ch6": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "1.32"
                },
                "temperature_sensor_ch7": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "1.97"
                },
                "temperature_sensor_ch8": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "1.15"
                },
                "leaf_wetness_sensor_ch1": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "1.71"
                },
                "leaf_wetness_sensor_ch2": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "1.74"
                },
                "leaf_wetness_sensor_ch3": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "0.97"
                },
                "leaf_wetness_sensor_ch4": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "0.82"
                },
                "leaf_wetness_sensor_ch5": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "1.91"
                },
                "leaf_wetness_sensor_ch6": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "0.30"
                },
                "leaf_wetness_sensor_ch7": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "0.39"
                },
                "leaf_wetness_sensor_ch8": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "0.09"
                },
                "ldsbatt_1": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "1.5"
                },
                "ldsbatt_2": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "1.3"
                },
                "ldsbatt_3": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "1.3"
                },
                "ldsbatt_4": {
                    "time": "1645596032",
                    "unit": "V",
                    "value": "1.5"
                }
            },
            "ch_lds1": {
                "air_ch1": {
                    "time": "1645596032",
                    "unit": "ft",
                    "value": "0.16"
                },
                "depth_ch1": {
                    "time": "1645596032",
                    "unit": "ft",
                    "value": "11.48"
                },
                "ldsheat_ch1": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "500"
                }
            },
            "ch_lds2": {
                "air_ch2": {
                    "time": "1645596032",
                    "unit": "ft",
                    "value": "0.16"
                },
                "depth_ch2": {
                    "time": "1645596032",
                    "unit": "ft",
                    "value": "11.48"
                },
                "ldsheat_ch2": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "500"
                }
            },
            "ch_lds3": {
                "air_ch3": {
                    "time": "1645596032",
                    "unit": "ft",
                    "value": "0.16"
                },
                "depth_ch3": {
                    "time": "1645596032",
                    "unit": "ft",
                    "value": "11.48"
                },
                "ldsheat_ch3": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "500"
                }
            },
            "ch_lds4": {
                "air_ch4": {
                    "time": "1645596032",
                    "unit": "ft",
                    "value": "0.16"
                },
                "depth_ch4": {
                    "time": "1645596032",
                    "unit": "ft",
                    "value": "11.48"
                },
                "ldsheat_ch4": {
                    "time": "1645596032",
                    "unit": "",
                    "value": "500"
                }
            },
            "WFC01-0xxxxxx8(WFC01 默认标题)": {
                "daily": {
                    "value": "0.0",
                    "unit": "L",
                    "day": "20240920"
                },
                "monthly": {
                    "value": "0.0",
                    "unit": "L",
                    "month": "202409"
                },
                "status": {
                    "value": "1",
                    "unit": "",
                    "time": "1726798265"
                },
                "flow_rate": {
                    "value": "0.0",
                    "unit": "L/min",
                    "time": "1726798265"
                },
                "temperature": {
                    "value": "171.9",
                    "unit": "℉",
                    "time": "1726798265"
                }
            },
            "AC1100-0xxxxxx1(AC1100 默认标题)": {
                "daily": {
                    "value": 19,
                    "unit": "W·h",
                    "day": "20240920"
                },
                "monthly": {
                    "value": 1.94,
                    "unit": "kW·h",
                    "month": "202409"
                },
                "status": {
                    "value": 1,
                    "unit": "",
                    "time": "1726798077"
                },
                "power": {
                    "value": 18,
                    "unit": "W",
                    "time": "1726798077"
                },
                "voltage": {
                    "value": 223,
                    "unit": "V",
                    "time": "1726798077"
                }
            },
            "WFC02-0xxxxxx1(WFC02 默认标题)": {
                "daily": {
                    "value": "0.000",
                    "unit": "m³",
                    "day": "20240920"
                },
                "monthly": {
                    "value": "0.000",
                    "unit": "m³",
                    "month": "202409"
                },
                "status": {
                    "value": "1",
                    "unit": "",
                    "time": "1726801575"
                },
                "flow_rate": {
                    "value": "0.000",
                    "unit": "m³/min",
                    "time": "1726801575"
                },
                "position": {
                    "value": "0",
                    "unit": "%",
                    "time": "1726801575"
                },
                "flowmeter": {
                    "value": "0",
                    "unit": "",
                    "time": "1726801575"
                }
            },
            "photo": {
                "time": "1670814912",
                "url": "https://osstest.ecowitt.net/images/webcam/v0/2022_12_12/1341/cf15e739f2100d84a32b69ccdcd25958.jpg"
            }
        }
    }
}
Response Parameters:

Parameter	Type	Remark
code	Integer	Status code
msg	String	Status message
time	String	Request time stamp
data	Object	Returned Data Object
id	Integer	Device id
name	String	Device name
mac	String	Device MAC/IMEI
imei	String	Device MAC/IMEI
type	Integer	type(1=weather station,2=camera)
date_zone_id	String	Device in Time zone
createtime	Integer	Device added time
longitude	Integer	Device in longitude
latitude	Integer	Device in latitude
stationtype	String	Wifi firmware version
last_update	Object	device data last updated
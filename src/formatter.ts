import { DateTimeFormatter, LocalDateTime, ZonedDateTime, ZoneId } from '@js-joda/core';

import '@js-joda/timezone';

let formatter = DateTimeFormatter.ofPattern('yyyy:MM:dd HH:mm:ss');

const localtime = ZonedDateTime.of(
  LocalDateTime.parse('2023:05:27 18:52:01', formatter),
  ZoneId.SYSTEM
);

const utcLocal = localtime.atZone(ZoneId.UTC) // wtf this is how it works. ask ai
console.log(utcLocal)
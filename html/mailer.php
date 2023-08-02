<?php

const mailAddresses = [
  "tlhdig@uni-wuerzburg.de",
  "charles.steitler@adwmainz.de"
];

function sendMailToAdmins(string $header, string $body)
{
  mail(
    implode(',', mailAddresses),
    "[TLHdig]" . $header,
    $body
  );
}
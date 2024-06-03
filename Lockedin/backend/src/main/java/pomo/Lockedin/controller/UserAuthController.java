package pomo.Lockedin.controller;

import jdk.jfr.Registered;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pomo.Lockedin.Requests.AuthenticationRequest;
import pomo.Lockedin.Requests.RegisterRequest;
import pomo.Lockedin.entities.AuthenticationResponse;
import pomo.Lockedin.service.AuthenticationService;

@RestController
@RequestMapping("/api/home/auth")
@RequiredArgsConstructor
public class UserAuthController {

    private final AuthenticationService authenticationService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.OK)
    public AuthenticationResponse register(@RequestBody RegisterRequest request){

        return authenticationService.register(request);

    }

    @PostMapping("/Authenticate")
    @ResponseStatus(HttpStatus.OK)
    public AuthenticationResponse register(@RequestBody AuthenticationRequest request){

        return authenticationService.authenticate(request);

    }




}

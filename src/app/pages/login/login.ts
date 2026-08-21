import { Component, OnInit } from '@angular/core';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {

  ngOnInit(): void {
    /*document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const pass = document.getElementById('password').value.trim();

            if (!email || !pass) {
                alert('⚠️ Por favor, completa todos los campos.');
                return;
            }

            alert('✅ Sesión iniciada correctamente (demo).\nBienvenido a ClinicaApp · ProsaMed');
        });*/
  }

}

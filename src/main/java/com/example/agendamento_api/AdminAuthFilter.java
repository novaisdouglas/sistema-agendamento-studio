

package com.example.agendamento_api;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class AdminAuthFilter implements Filter {

    @Value("${admin.password}")
    private String adminPassword;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {


      HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Password");

        String path = req.getRequestURI();
        String method = req.getMethod();

        // Libera pré-requisições CORS do navegador
        if ("OPTIONS".equalsIgnoreCase(method)) {
            chain.doFilter(request, response);
            return;
        }

        // Identifica rotas exclusivas do Admin
        boolean isRotaAdmin =
                path.endsWith("/concluir") ||
                (path.equals("/agendamentos") && "GET".equalsIgnoreCase(method) && req.getParameter("data") == null) ||
                (path.startsWith("/disponibilidade") && !"GET".equalsIgnoreCase(method));

        if (isRotaAdmin) {
            String tokenRecebido = req.getHeader("X-Admin-Password");

            if (tokenRecebido == null || !tokenRecebido.equals(adminPassword)) {
                res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                res.setContentType("text/plain;charset=UTF-8");
                res.getWriter().write("Acesso negado: senha administrativa inválida.");
                return;
            }
        }

        chain.doFilter(request, response);
    }
}
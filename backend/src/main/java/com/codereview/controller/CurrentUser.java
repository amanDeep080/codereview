package com.codereview.controller;

import com.codereview.entity.User;
import org.springframework.security.core.context.SecurityContextHolder;

/** Small helper so controllers don't repeat SecurityContext boilerplate. */
public class CurrentUser {
    public static User get() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}

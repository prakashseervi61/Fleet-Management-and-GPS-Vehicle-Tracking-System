package com.examly.springapp.repository;

import com.examly.springapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

 



@Repository
public interface UserRepository extends JpaRepository<User, Long> {

     




    Optional<User> findByEmail(String email);

     




    Optional<User> findByPhoneNumber(String phoneNumber);

     




    boolean existsByEmail(String email);

     




    boolean existsByPhoneNumber(String phoneNumber);

     




    boolean existsByEmailIgnoreCase(String email);
}
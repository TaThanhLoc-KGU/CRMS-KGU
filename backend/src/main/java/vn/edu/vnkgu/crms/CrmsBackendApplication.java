package vn.edu.vnkgu.crms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableAsync
@EnableScheduling
public class CrmsBackendApplication {

	public static void main(String[] args) {
		// All timestamps are stored as timestamptz/Instant; pinning the JVM clock to UTC
		// keeps behavior independent of the host's local timezone (and its tzdata quirks).
		TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
		SpringApplication.run(CrmsBackendApplication.class, args);
	}

}
